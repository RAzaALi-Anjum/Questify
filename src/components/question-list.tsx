"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/types/types";
import {
    CheckCircle,
    XCircle,
    HelpCircle,
    Check,
    Clock,
    Award,
    BookOpen,
    AlertTriangle,
} from "lucide-react";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";
import confetti from "canvas-confetti";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { Locale } from "@/i18n.config";
import { TranslationLoading } from "./translation-loading";

interface ShortAnswerResult {
    score: number | null;
    reason: string | null;
}

interface QuestionListProps {
    questions: Question[];
    timeLimit?: number | null;
    lang: Locale;
}

export function QuestionList({
    questions: initialQuestions,
    timeLimit = null,
    lang,
}: QuestionListProps) {
    const [dictionary, setDictionary] = useState<any>(null);
    const [questions, setQuestions] = useState(initialQuestions);
    const [selectedAnswers, setSelectedAnswers] = useState<
        (number[] | string | undefined)[]
    >(new Array(questions.length).fill(undefined));
    const [showResults, setShowResults] = useState(false);
    const [showHint, setShowHint] = useState<number[]>([]);
    const [answerResults, setAnswerResults] = useState<boolean[]>(
        new Array(initialQuestions.length).fill(false)
    );
    const [shortAnswerDetails, setShortAnswerDetails] = useState<
        Record<number, ShortAnswerResult>
    >({});
    const [isChecking, setIsChecking] = useState(false);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState<string>("00:00");
    const [timeRemaining, setTimeRemaining] = useState(
        timeLimit ? timeLimit * 60 : 0
    );
    const [isPenalized, setIsPenalized] = useState(false);
    const [autoSubmitWarning, setAutoSubmitWarning] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizMode, setQuizMode] = useState<"all" | "one-by-one">("all");
    const resultsRef = useRef<HTMLDivElement>(null);
    const [lastCorrectCount, setLastCorrectCount] = useState(0);
    const [lastFinalScore, setLastFinalScore] = useState(0);

    useEffect(() => {
        setQuestions(initialQuestions);
    }, [initialQuestions]);

    useEffect(() => {
        const fetchDictionary = async () => {
            const dict = await getDictionary(lang);
            setDictionary(dict);
        };
        fetchDictionary();
    }, [lang]);

    // Shuffle multiple-choice options once at the beginning
    useEffect(() => {
        if (questions.some((q) => q.type === "multiple-choice")) {
            setQuestions((prevQuestions) =>
                prevQuestions.map(shuffleMultipleChoiceOptions)
            );
        }
    }, []);

    useEffect(() => {
        const answered = selectedAnswers.filter((answer) =>
            Array.isArray(answer)
                ? answer.length > 0
                : answer !== undefined && answer !== ""
        ).length;
        setAnsweredCount(answered);
    }, [selectedAnswers]);

    // Start timer when component mounts
    useEffect(() => {
        setStartTime(new Date());
    }, []);

    // Update elapsed time every second
    useEffect(() => {
        if (!timeLimit) return;
        if (!startTime || endTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setElapsedTime(
                `${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`
            );

            // Update remaining time
            const remaining = timeLimit * 60 - Math.floor(diff / 1000);
            setTimeRemaining(remaining);

            // Show warning when 60 seconds remain
            if (remaining === 60) {
                setAutoSubmitWarning(true);
            }

            // Auto-submit when time runs out
            if (remaining <= 0) {
                clearInterval(timer);
                handleTimeUp();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, endTime, timeLimit]);

    const handleSelect = (questionIndex: number, answer: number | string) => {
        setSelectedAnswers((prev) => {
            const newAnswers = [...prev];
            const question = questions[questionIndex];

            if (question.type === "multiple-choice") {
                let currentAnswers = Array.isArray(newAnswers[questionIndex])
                    ? (newAnswers[questionIndex] as number[])
                    : [];
                const isMultipleSelection =
                    (question.correctAnswersCount || 1) > 1;

                if (typeof answer === "number") {
                    if (isMultipleSelection) {
                        if (currentAnswers.includes(answer)) {
                            currentAnswers = currentAnswers.filter(
                                (a) => a !== answer
                            );
                        } else if (
                            currentAnswers.length <
                            (question.correctAnswersCount || 1)
                        ) {
                            currentAnswers = [...currentAnswers, answer].sort(
                                (a, b) => a - b
                            );
                        }
                        newAnswers[questionIndex] = currentAnswers;
                    } else {
                        newAnswers[questionIndex] = [answer];
                    }
                }
            } else if (question.type === "true-false") {
                if (
                    typeof answer === "string" &&
                    ["true", "false"].includes(answer)
                ) {
                    newAnswers[questionIndex] = answer;
                }
            } else if (question.type === "short-answer") {
                if (typeof answer === "string") {
                    newAnswers[questionIndex] = answer;
                }
            }

            return newAnswers;
        });
    };

    const checkShortAnswer = async (
        questionIndex: number,
        userAnswer: string,
        correctAnswer: string
    ): Promise<boolean> => {
        if (!userAnswer || userAnswer.trim() === "") {
            setShortAnswerDetails((prev) => ({
                ...prev,
                [questionIndex]: { score: 0, reason: "No answer provided." },
            }));
            return false;
        }
        try {
            const response = await fetch("/api/check-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userAnswer, correctAnswer }),
            });
            if (!response.ok) {
                console.error("API Error:", response.statusText);
                const errorText = await response.text();
                setShortAnswerDetails((prev) => ({
                    ...prev,
                    [questionIndex]: {
                        score: null,
                        reason: `API Error: ${response.statusText} - ${errorText}`,
                    },
                }));
                return false;
            }
            const data = await response.json();
            if (data.error) {
                console.error("API Error Message:", data.error);
                setShortAnswerDetails((prev) => ({
                    ...prev,
                    [questionIndex]: {
                        score: null,
                        reason: `API Error: ${data.error}`,
                    },
                }));
                return false;
            }

            const { score, reason } = data as { score: number; reason: string };
            setShortAnswerDetails((prev) => ({
                ...prev,
                [questionIndex]: { score, reason },
            }));
            const isCorrect = score >= 75;
            return isCorrect;
        } catch (error) {
            console.error("Error checking short answer:", error);
            setShortAnswerDetails((prev) => ({
                ...prev,
                [questionIndex]: {
                    score: null,
                    reason: `Client Error: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                },
            }));
            return false;
        }
    };

    const checkAnswer = async (questionIndex: number): Promise<boolean> => {
        const question = questions[questionIndex];
        const selectedAnswer = selectedAnswers[questionIndex];

        if (!question || selectedAnswer === undefined) return false;

        if (question.type === "multiple-choice") {
            const correctAnswers = (
                Array.isArray(question.correctAnswer)
                    ? question.correctAnswer
                    : [question.correctAnswer]
            ) as number[];

            const selected = (
                Array.isArray(selectedAnswer)
                    ? selectedAnswer
                    : [selectedAnswer]
            ) as (number | undefined)[];
            const validSelected = selected.filter(
                (s) => s !== undefined
            ) as number[];
            validSelected.sort((a, b) => a - b);
            const sortedCorrectAnswers = [...correctAnswers].sort(
                (a, b) => a - b
            );

            return (
                sortedCorrectAnswers.length === validSelected.length &&
                sortedCorrectAnswers.every(
                    (answer, index) => answer === validSelected[index]
                )
            );
        }

        if (question.type === "true-false") {
            const correctAnswerBool =
                typeof question.correctAnswer === "boolean"
                    ? String(question.correctAnswer)
                    : String(question.correctAnswer).toLowerCase();

            return String(selectedAnswer).toLowerCase() === correctAnswerBool;
        }

        if (question.type === "short-answer") {
            return await checkShortAnswer(
                questionIndex,
                String(selectedAnswer),
                String(question.correctAnswer)
            );
        }

        console.warn("Unsupported question type for checking:", question.type);
        return false;
    };

    const handleCheckAnswers = async () => {
        setIsChecking(true);
        setEndTime(new Date());
        const details: Record<number, ShortAnswerResult> = {};
        const results: boolean[] = new Array(questions.length).fill(false);
        
        await Promise.all(questions.map(async (q, idx) => {
            if (q.type === 'short-answer') {
                const userAnswer = selectedAnswers[idx] as string;
                if (userAnswer && userAnswer.trim() !== "") {
                    const res = await fetch('/api/check-answer', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userAnswer, correctAnswer: q.correctAnswer }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        details[idx] = { score: data.score, reason: data.reason };
                    } else {
                        details[idx] = { score: null, reason: "Error checking answer." };
                    }
                }
            } else {
                // For multiple-choice and true-false questions
                results[idx] = await checkAnswer(idx);
            }
        }));
        
        setShortAnswerDetails(details);
        setAnswerResults(results);
        setShowResults(true);

        // Calculate correctCount and finalScore using local variables
        const correctCount = questions.reduce((count, q, idx) => {
            if (q.type === 'short-answer') {
                return count + (details[idx]?.score !== null && details[idx]?.score >= 75 ? 1 : 0);
            } else {
                return count + (results[idx] ? 1 : 0);
            }
        }, 0);
        const finalScore = calculateFinalScore(correctCount, questions.length);
        setLastCorrectCount(correctCount);
        setLastFinalScore(finalScore);

        if (finalScore >= 70) {
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                });
            }, 500);
        }

        // Scroll to results
        setTimeout(() => {
            if (resultsRef.current) {
                resultsRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
        setIsChecking(false);
    };

    const handleTimeUp = async () => {
        setIsPenalized(true);
        await handleCheckAnswers();
    };

    const toggleHint = (index: number) => {
        setShowHint((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    const handleRetakeQuiz = () => {
        setQuestions((prevQuestions) => {
            const shuffledQuestions = shuffleArray([...prevQuestions]);
            return shuffledQuestions.map(shuffleMultipleChoiceOptions);
        });
        setSelectedAnswers(new Array(questions.length).fill(undefined));
        setShowResults(false);
        setAnswerResults(new Array(questions.length).fill(false));
        setShowHint([]);
        setShortAnswerDetails({});
        setStartTime(new Date());
        setEndTime(null);
        setElapsedTime("00:00");
        setTimeRemaining(timeLimit ? timeLimit * 60 : 0);
        setIsPenalized(false);
        setAutoSubmitWarning(false);
        setCurrentQuestionIndex(0);
    };

    const getFormattedAnswers = (
        question: Question,
        correctAnswers: number[]
    ) => {
        if (!question.options) return "";

        if (correctAnswers.length === 1) {
            return correctAnswers[0] >= 0 &&
                correctAnswers[0] < question.options.length
                ? question.options[correctAnswers[0]]
                : "Invalid Answer Index";
        }

        return correctAnswers
            .map((index) =>
                index >= 0 && index < question.options!.length
                    ? `• ${question.options![index]}`
                    : "• Invalid Answer Index"
            )
            .join("\n");
    };

    const calculatePercentage = (correct: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    };

    const formatTimeSpent = (startTime: Date | null, endTime: Date | null) => {
        if (!startTime || !endTime) return "--m --s";
        const diff = endTime.getTime() - startTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const formatTimeRemaining = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const calculateFinalScore = (
        correctCount: number,
        totalQuestions: number
    ) => {
        if (totalQuestions === 0) return 0;
        const baseScore = (correctCount / totalQuestions) * 100;
        let finalScore = baseScore;
        if (isPenalized) {
            finalScore = Math.max(0, baseScore - 10);
        }
        return Math.round(finalScore);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const correctCount = questions.reduce((count, q, idx) => {
        if (q.type === 'short-answer') {
            // For short-answer questions, check if score >= 75 (considered correct)
            return count + (shortAnswerDetails[idx]?.score !== null && shortAnswerDetails[idx]?.score >= 75 ? 1 : 0);
        } else {
            // For other question types, use answerResults
            return count + (answerResults[idx] ? 1 : 0);
        }
    }, 0);
    const finalScore = calculateFinalScore(correctCount, questions.length);

    // Determine which questions to render based on quiz mode
    const questionsToRender =
        quizMode === "all" ? questions : [questions[currentQuestionIndex]];

    if (!dictionary) {
        // Show loading state or fallback while dictionary is loading
        return <TranslationLoading/>;
    }

    return (
        <div>
            {/* Quiz Header with Progress and Controls */}
            <div className="sticky top-0 z-10 py-6 backdrop-blur-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 mb-8">
                <div className="px-6 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <BookOpen className="h-6 w-6 text-[hsl(var(--themed-blue))]" />
                        <h2 className="text-2xl font-bold tracking-tight">
                            {showResults ? dictionary.quiz_results : dictionary.quiz_questions}
                        </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-medium text-gray-600 dark:text-gray-300">
                                {dictionary.view_mode}
                            </span>
                            <div className="flex rounded-full p-1 bg-gray-100 dark:bg-gray-800">
                                <button
                                    onClick={() => setQuizMode("all")}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${quizMode === "all" ? "bg-[hsl(var(--themed-blue))] text-white shadow" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
                                >
                                    {dictionary.all_questions}
                                </button>
                                <button
                                    onClick={() => setQuizMode("one-by-one")}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${quizMode === "one-by-one" ? "bg-[hsl(var(--themed-blue))] text-white shadow" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
                                >
                                    {dictionary.one_by_one}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow border border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {dictionary.progress}
                            </span>
                            <span className="text-base font-semibold">
                                {answeredCount} / {questions.length}
                            </span>
                        </div>
                        {timeLimit && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow border ${timeRemaining <= 60 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                                <Clock className={`h-5 w-5 ${timeRemaining <= 60 ? "text-red-500 dark:text-red-400" : ""}`} />
                                <span className={`text-base font-mono ${timeRemaining <= 60 ? "text-red-600 dark:text-red-400" : ""}`}>{formatTimeRemaining(timeRemaining)}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] transition-all duration-500 ease-out" style={{ width: `${calculatePercentage(answeredCount, questions.length)}%` }} />
                </div>
                {quizMode === "one-by-one" && !showResults && (
                    <div className="flex items-center justify-between mt-4 px-6">
                        <button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0} className="px-4 py-2 text-sm rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 shadow">
                            {dictionary.previous}
                        </button>
                        <span className="text-base font-semibold">
                            {dictionary.question_of.replace("{current}", currentQuestionIndex + 1).replace("{total}", questions.length)}
                        </span>
                        <button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1} className="px-4 py-2 text-sm rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 shadow">
                            {dictionary.next}
                        </button>
                    </div>
                )}
            </div>
            {/* Results summary */}
            {showResults && (
                <div ref={resultsRef} className="themed-card p-8 border-2 border-[hsl(var(--ghibli-cream))] dark:border-gray-700 bg-gradient-to-br from-white to-[hsl(var(--ghibli-cream))/30] dark:from-gray-800 dark:to-gray-800/50 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold mb-8 text-center relative inline-block">
                        <span className="relative z-10">{dictionary.quiz_results}</span>
                        <div className="absolute bottom-0 left-0 h-3 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Score Card */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center transform transition-transform hover:scale-105">
                            <p className="text-base text-gray-500 dark:text-gray-400 mb-2">{dictionary.score}</p>
                            <div className="relative inline-block">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--themed-blue))/20] to-[hsl(var(--themed-green))/20] blur-xl"></div>
                                <p className={`text-5xl font-extrabold relative z-10 ${lastFinalScore >= 70 ? "text-green-600 dark:text-green-400" : lastFinalScore >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{lastFinalScore}%</p>
                            </div>
                            {lastFinalScore >= 70 && <Award className="h-8 w-8 mx-auto mt-3 text-yellow-500" />}
                        </div>
                        {/* Correct Answers Card */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center transform transition-transform hover:scale-105">
                            <p className="text-base text-gray-500 dark:text-gray-400 mb-2">{dictionary.correct_answers}</p>
                            <p className="text-5xl font-extrabold text-[hsl(var(--themed-blue))]">{lastCorrectCount} <span className="text-lg text-gray-400 dark:text-gray-500">/ {questions.length}</span></p>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mt-3">
                                <div className="bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] h-3 rounded-full" style={{ width: `${(lastCorrectCount / questions.length) * 100}%` }}></div>
                            </div>
                        </div>
                        {/* Time Spent Card */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center transform transition-transform hover:scale-105">
                            <p className="text-base text-gray-500 dark:text-gray-400 mb-2">{dictionary.time_spent}</p>
                            <p className="text-5xl font-extrabold text-[hsl(var(--themed-forest))]">{formatTimeSpent(startTime, endTime)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{isPenalized ? dictionary.time_limit_exceeded : dictionary.completed_in_time}</p>
                        </div>
                    </div>
                    {isPenalized && (
                        <div className="p-4 mb-6 text-base rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center">
                            <AlertTriangle className="inline-block h-5 w-5 mr-2" />
                            <span>{dictionary.penalty_applied}</span>
                        </div>
                    )}
                    <div className="flex justify-center mt-6">
                        <button onClick={handleRetakeQuiz} className="px-8 py-4 bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] text-white rounded-full hover:opacity-90 transition-all shadow-lg flex items-center gap-3 text-lg font-semibold">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/></svg>
                            {dictionary.retake_quiz}
                        </button>
                    </div>
                </div>
            )}
            {/* Questions */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {questionsToRender.map((question, qIndex) => {
                    const actualIndex = quizMode === "one-by-one" ? currentQuestionIndex : qIndex;
                    return (
                        <div key={actualIndex} className={`p-8 rounded-2xl border-2 transition-all duration-300 shadow-lg bg-white dark:bg-gray-900 ${showResults ? answerResults[actualIndex] ? "border-green-300 bg-green-50/60 dark:border-green-800 dark:bg-green-900/20" : "border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20" : "border-[hsl(var(--ghibli-cream))] dark:border-gray-700"}`}>
                            <div className="flex gap-4 items-center mb-4">
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[hsl(var(--themed-blue))] text-white font-bold text-lg shadow">
                                    {actualIndex + 1}
                                </div>
                                <h3 className="text-xl font-semibold flex-1">{question.question}</h3>
                            </div>
                            <div className="space-y-4">
                                {question.type === "multiple-choice" && (
                                    <>
                                        {question.correctAnswersCount &&
                                            question.correctAnswersCount > 1 && (
                                            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900">
                                                <div className="flex-1">
                                                    <h4 className="text-base font-bold text-blue-700 dark:text-blue-200">
                                                        {dictionary.multiple_selection_required}
                                                    </h4>
                                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                                        {dictionary.select_n_answers.replace("{count}", question.correctAnswersCount)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid gap-3">
                                            {question.options?.map(
                                                (
                                                    option,
                                                    oIndex
                                                ) => {
                                                    const isSelected =
                                                        Array.isArray(
                                                            selectedAnswers[
                                                                actualIndex
                                                            ]
                                                        ) &&
                                                        (
                                                            selectedAnswers[
                                                                actualIndex
                                                            ] as number[]
                                                        ).includes(
                                                            oIndex
                                                        );
                                                    const isMultiple =
                                                        (question.correctAnswersCount ||
                                                            1) >
                                                        1;
                                                    const isDisabled =
                                                        showResults ||
                                                        (!isSelected &&
                                                            isMultiple &&
                                                            Array.isArray(
                                                                selectedAnswers[
                                                                    actualIndex
                                                                ]
                                                            ) &&
                                                            (
                                                                selectedAnswers[
                                                                    actualIndex
                                                                ] as number[]
                                                            )
                                                                .length >=
                                                                (question.correctAnswersCount ||
                                                                    1));

                                                    // Determine if this option is correct (only for results view)
                                                    const isCorrectOption =
                                                        showResults &&
                                                        Array.isArray(
                                                            question.correctAnswer
                                                        ) &&
                                                        question.correctAnswer.includes(
                                                            oIndex
                                                        );

                                                    return (
                                                        <button
                                                            key={
                                                                oIndex
                                                            }
                                                            onClick={() =>
                                                                handleSelect(
                                                                    actualIndex,
                                                                    oIndex
                                                                )
                                                            }
                                                            disabled={
                                                                isDisabled
                                                            }
                                                            className={`
                                    relative w-full p-4 text-left transition-all rounded-xl
                                    ${
                                        isDisabled
                                            ? "opacity-70 cursor-not-allowed"
                                            : "hover:transform hover:scale-[1.01]"
                                    }
                                    ${
                                        showResults && isCorrectOption
                                            ? "ring-2 ring-green-500 dark:ring-green-400"
                                            : ""
                                    }
                                    group
                                  `}
                                                        >
                                                            <div
                                                                className={`
                                        absolute inset-0 rounded-xl transition-all duration-200
                                        ${
                                            isSelected
                                                ? isMultiple
                                                    ? "border-2 border-[hsl(var(--themed-blue))] bg-[hsl(var(--themed-blue))]/10 dark:border-[hsl(var(--themed-blue))] dark:bg-[hsl(var(--themed-blue))]/20"
                                                    : "bg-[hsl(var(--themed-blue))] dark:bg-[hsl(var(--themed-blue))]"
                                                : "border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        }
                                        ${
                                            showResults && isCorrectOption
                                                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                                                : ""
                                        }
                                      `}
                                                            />

                                                            <div className="relative flex items-center gap-3">
                                                                <div
                                                                    className={`
                                          flex items-center justify-center w-5 h-5 border rounded-md
                                          ${
                                              isSelected
                                                  ? isMultiple
                                                      ? "bg-[hsl(var(--themed-blue))] border-[hsl(var(--themed-blue))] text-white"
                                                      : "bg-[hsl(var(--themed-blue))] border-[hsl(var(--themed-blue))] text-white"
                                                  : "border-gray-300 dark:border-gray-600 text-transparent"
                                          }
                                          transition-colors
                                        `}
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                </div>

                                                                <span
                                                                    className={`
                                          flex-1 text-sm
                                          ${
                                              isSelected
                                                  ? isMultiple
                                                      ? "font-medium text-gray-900 dark:text-white"
                                                      : "font-medium text-gray-900 dark:text-white"
                                                  : "font-normal text-gray-700 dark:text-gray-300"
                                          }
                                        `}
                                                                >
                                                                    {
                                                                        option
                                                                    }
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </>
                                )}
                                {question.type === "true-false" && (
                                    <div className="flex gap-3">
                                        {[true, false].map(
                                            (value) => {
                                                const isSelected =
                                                    selectedAnswers[
                                                        actualIndex
                                                    ] ===
                                                    String(
                                                        value
                                                    );
                                                // Determine if this option is correct (only for results view)
                                                const isCorrectOption =
                                                    showResults &&
                                                    String(
                                                        question.correctAnswer
                                                    ).toLowerCase() ===
                                                        String(
                                                            value
                                                        ).toLowerCase();

                                                return (
                                                    <button
                                                        key={String(
                                                            value
                                                        )}
                                                        onClick={() =>
                                                            handleSelect(
                                                                actualIndex,
                                                                String(
                                                                    value
                                                                )
                                                            )
                                                        }
                                                        disabled={
                                                            showResults
                                                        }
                                                        className={`
                                        flex-1 p-4 rounded-xl border-2 text-center transition-all relative overflow-hidden
                                        ${
                                            isSelected
                                                ? "border-[hsl(var(--themed-blue))] bg-[hsl(var(--themed-blue))] text-white"
                                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        }
                                        ${
                                            showResults && isCorrectOption
                                                ? "ring-2 ring-green-500 dark:ring-green-400"
                                                : ""
                                        }
                                        ${
                                            showResults
                                                ? "cursor-not-allowed opacity-80"
                                                : "hover:border-[hsl(var(--themed-blue))] hover:bg-[hsl(var(--themed-blue))]/10"
                                        }
                                      `}
                                                    >
                                                        {/* Decorative background for selected state */}
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-forest))]"></div>
                                                        )}

                                                        {/* Content */}
                                                        <div className="relative z-10 flex items-center justify-center gap-2">
                                                            {isSelected && (
                                                                <Check className="w-4 h-4" />
                                                            )}
                                                            <span className="font-medium">
                                                                {String(
                                                                    value
                                                                )
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase() +
                                                                    String(
                                                                        value
                                                                    ).slice(
                                                                        1
                                                                    )}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                                {question.type === "short-answer" && (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={
                                                (selectedAnswers[
                                                    actualIndex
                                                ] as string) ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                handleSelect(
                                                    actualIndex,
                                                    e.target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                showResults
                                            }
                                            placeholder="Type your answer here..."
                                            className={`
                                    w-full p-4 rounded-xl border-2 bg-white dark:bg-gray-800 
                                    ${
                                        showResults
                                            ? "border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                            : "border-[hsl(var(--ghibli-cream))] dark:border-gray-700 focus:border-[hsl(var(--themed-blue))] focus:ring-2 focus:ring-[hsl(var(--themed-blue))]/30"
                                    }
                                    outline-none transition-colors
                                  `}
                                        />

                                        {/* Character counter */}
                                        {!showResults && (
                                            <div className="flex justify-end">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {((selectedAnswers[actualIndex] as string) || "").length} characters
                                                </span>
                                            </div>
                                        )}
                                        {/* Feedback display in results mode */}
                                        {showResults && shortAnswerDetails[actualIndex] && (
                                            <div className="mt-2 flex items-center gap-2 p-3 rounded-lg border text-sm"
                                                style={{
                                                    borderColor:
                                                        shortAnswerDetails[actualIndex].score === null
                                                            ? '#e5e7eb'
                                                            : shortAnswerDetails[actualIndex].score >= 90
                                                            ? '#22c55e'
                                                            : shortAnswerDetails[actualIndex].score >= 50
                                                            ? '#facc15'
                                                            : '#ef4444',
                                                    backgroundColor:
                                                        shortAnswerDetails[actualIndex].score === null
                                                            ? ''
                                                            : shortAnswerDetails[actualIndex].score >= 90
                                                            ? '#dcfce7'
                                                            : shortAnswerDetails[actualIndex].score >= 50
                                                            ? '#fef9c3'
                                                            : '#fee2e2',
                                                }}
                                            >
                                                <span className="text-xl">
                                                    {shortAnswerDetails[actualIndex].score === null
                                                        ? ''
                                                        : shortAnswerDetails[actualIndex].score >= 90
                                                        ? '✅'
                                                        : shortAnswerDetails[actualIndex].score >= 50
                                                        ? '⚠️'
                                                        : '❌'}
                                                </span>
                                                <span>
                                                    <b>Score:</b> {shortAnswerDetails[actualIndex].score ?? '--'}
                                                    <br />
                                                    <b>Reason:</b> {shortAnswerDetails[actualIndex].reason ?? ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {showResults && (
                                <div className="mt-4">
                                    {/* Multiple-choice/True-false feedback */}
                                    {['multiple-choice', 'true-false'].includes(question.type) && (
                                        <div
                                            className={`rounded-lg p-4 border text-base font-bold mt-2 ${answerResults[actualIndex]
    ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-900/20 text-green-700 dark:text-green-200'
    : 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-900/20 text-red-700 dark:text-red-200'}`}
                                        >
                                            <div className="font-bold mb-1">
                                                {answerResults[actualIndex] ? 'Correct' : 'Incorrect'}
                                            </div>
                                            {/* Show correct answer(s) if incorrect */}
                                            {!answerResults[actualIndex] && (
                                                <div className="mb-1">
                                                    <span className="font-semibold">Correct Answer(s):</span>
                                                    <div>
                                                        {question.type === 'multiple-choice' && Array.isArray(question.correctAnswer)
                                                            ? question.correctAnswer.map((idx: number) => question.options?.[idx]).join(', ')
                                                            : question.type === 'multiple-choice' && typeof question.correctAnswer === 'number'
                                                            ? question.options?.[question.correctAnswer]
                                                            : question.type === 'true-false'
                                                            ? String(question.correctAnswer)
                                                            : ''}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Show explanation if available */}
                                            {question.why && (
                                                <div className="mb-1">
                                                    <span className="font-semibold">Explanation:</span>
                                                    <div>{question.why}</div>
                                                </div>
                                            )}
                                            {/* Show page if available */}
                                            {question.page && (
                                                <div className="text-xs text-gray-500 mt-1">Page {question.page}</div>
                                            )}
                                        </div>
                                    )}
                                    {/* Short-answer feedback */}
                                    {question.type === 'short-answer' && shortAnswerDetails[actualIndex] && (
                                        <div
                                            className={`rounded-lg p-4 border text-base font-bold mt-2 ${shortAnswerDetails[actualIndex].score !== null && shortAnswerDetails[actualIndex].score >= 75
    ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-900/20 text-green-700 dark:text-green-200'
    : shortAnswerDetails[actualIndex].score !== null && shortAnswerDetails[actualIndex].score >= 50
    ? 'border-yellow-400 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200'
    : 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-900/20 text-red-700 dark:text-red-200'}`}
                                        >
                                            <div className="font-bold mb-1">
                                                {shortAnswerDetails[actualIndex].score !== null && shortAnswerDetails[actualIndex].score >= 75
                                                    ? 'Correct'
                                                    : `Incorrect (${shortAnswerDetails[actualIndex].score ?? 0}%)`}
                                            </div>
                                            {/* Model's reason */}
                                            {shortAnswerDetails[actualIndex].reason && (
                                                <div className="mb-1">{shortAnswerDetails[actualIndex].reason}</div>
                                            )}
                                            {/* Expected answer */}
                                            <div className="mb-1">
                                                <span className="font-semibold">Expected Answer:</span> {question.correctAnswer}
                                            </div>
                                            {/* Explanation if available */}
                                            {question.why && (
                                                <div className="mb-1">
                                                    <span className="font-semibold">Explanation:</span>
                                                    <div>{question.why}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Centered Check Answers button below all questions */}
            {!showResults && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleCheckAnswers}
                        disabled={isChecking || answeredCount < questions.length}
                        className="px-8 py-3 rounded-full bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] text-white text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isChecking ? "Checking..." : dictionary?.check_answers_button || "Check Answers"}
                    </button>
                </div>
            )}
        </div>
    );
}
