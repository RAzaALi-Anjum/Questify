"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Question, QuestionSchema, GenerateQuestionsParams, Model } from "@/types/types";
import { decodeQuiz } from "@/utils/share";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";
// import { useObject } from 'ai/react'; // Assuming useObject is from Vercel AI SDK - Commented out as it's causing an error
import Link from 'next/link'; // Added import for Link
import UserUsage from "@/components/UserUsage";

// UI Components
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Added import for Switch
import { Button } from "@/components/ui/button"; // Assuming Button is used or can be added
import { Input } from "@/components/ui/input"; // Assuming Input is used or can be added

// Icons from lucide-react
import { Sparkles, GithubIcon, BookOpen, Wand2, Lightbulb, HeartIcon, FileText, Settings, Brain, CheckCircle, XCircle, Clock, Calendar, Users, MessageSquare, Download, Share2, Trash2, Edit3, PlusCircle, MinusCircle, AlertTriangle, Info, Copy, ExternalLink, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, EyeOff, Filter, ListChecks, Palette, Moon, Sun, Menu, X, Search, UploadCloud, Zap, ThumbsUp, ThumbsDown, Repeat, RotateCcw, Save, SlidersHorizontal, Terminal, UserCircle, Bot, BrainCircuit, Leaf } from 'lucide-react';
import { getDictionary } from "./dictionaries";
import { Locale } from "@/i18n.config";
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { DecorativeAccents } from "@/components/decorative-accents";
import { ExpandedTextarea } from "@/components/expanded-textarea";
import { ExportQuestions } from "@/components/export-questions";
import { FileUpload } from "@/components/file-upload";
import { InteractiveBackground } from "@/components/interactive-background";
import { LoadingState } from "@/components/loading-state";
import { ModeToggle } from "@/components/ModeToggle";
import { NumberSelector } from "@/components/number-selector";
import { QuestionList } from "@/components/question-list";
import { RateLimitError } from "@/components/rate-limit-error";
import { ShareQuiz } from "@/components/share-quiz";
import { Submit } from "@/components/submit";
import { ThemedCard } from "@/components/themed-card";
import { ThemedSectionTitle } from "@/components/themed-section-title";
import RequireAuth from "@/components/RequireAuth";


// Separate component for quiz content
function QuizContent({ setUsageRefresh }: { setUsageRefresh: (fn: (r: number) => number) => void }) {
    const { lang } = useParams();
    const [dictionary, setDictionary] = useState<any>(null);
    const [translationLoading, setTranslationLoading] = useState(true);
    const [usage, setUsage] = useState<any>(null);
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        const fetchDict = async () => {
            if (lang) {
                const d = await getDictionary(lang as Locale);
                setDictionary(d);
                setTranslationLoading(false);
            } else {
                // Fallback or error handling if lang is not available
                const d = await getDictionary('en'); // Default to 'en' or handle error
                setDictionary(d);
                setTranslationLoading(false);
            }
        };
        fetchDict();
    }, [lang]);

    // Fetch usage info for quota enforcement
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        fetch("http://localhost:5000/usage", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then((data) => setUsage(data))
            .catch(() => setUsage(null));
    }, [setUsageRefresh]);

    // Payment handler
    const handlePay = async (plan: "monthly" | "yearly") => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        // Example price IDs, replace with your real Stripe price IDs
        const priceId = plan === "monthly"
            ? "price_monthly_id_here"
            : "price_yearly_id_here";
        const res = await fetch("http://localhost:5000/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ priceId }),
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            alert("Payment error: " + (data.message || "Unknown error"));
        }
    };

  const [input, setInput] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [questionType, setQuestionType] = useState<"multiple-choice" | "true-false" | "short-answer" | "mixed">("mixed");
  // Remove model selection state and always use DeepSeek
  // const [selectedModel, setSelectedModel] = useState<Model>("gemini-2.0-flash");
  const selectedModel: Model = "deepseek-chat";
  const [questionCount, setQuestionCount] = useState(5);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [sharedQuiz, setSharedQuiz] = useState<Question[] | null>(null);
  const [optionsCount, setOptionsCount] = useState(4);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [correctAnswersCount, setCorrectAnswersCount] = useState(1);
  const [isRandomCorrectAnswers, setIsRandomCorrectAnswers] = useState(false);
  const [minCorrectAnswers, setMinCorrectAnswers] = useState(1);
  const [maxCorrectAnswers, setMaxCorrectAnswers] = useState(2);
  const [isTimeLimitEnabled, setIsTimeLimitEnabled] = useState(false);
  const [quizTimeLimit, setQuizTimeLimit] = useState(30);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  const {
    isLoading,
    object: result,
    submit,
    stop,
    error,
  } = useObject({
    api: "/api/chat",
    schema: QuestionSchema,
  });

  useEffect(() => {
    const quizParam = searchParams.get("quiz");
    if (quizParam) {
      try {
        const decoded = decodeQuiz(quizParam);
        if (decoded && Array.isArray(decoded) && decoded.length > 0) {
          const shuffledQuestions = shuffleArray([...decoded]);
          const updatedShuffledQuestions = shuffledQuestions.map(shuffleMultipleChoiceOptions);
          setSharedQuiz(updatedShuffledQuestions);
        } else {
          throw new Error("Invalid quiz data");
        }
      } catch (error) {
        console.error("Error loading shared quiz:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load the shared quiz. The link might be invalid or corrupted.",
        });
      }
    }
  }, [searchParams, toast]);
  // Remove setRemainingGenerations from handleSubmit
  // setRemainingGenerations(remainingGenerations ? remainingGenerations - 1 : 0);
  useEffect(() => {
    const paymentSuccess = searchParams.get("payment_success");
    const paymentCancel = searchParams.get("payment_cancel");

    if (paymentSuccess === "true") {
      toast({
        title: dictionary?.payment_successful_title || "Payment Successful!",
        description: dictionary?.payment_successful_description || "5 credits have been added to your account.",
        variant: "default", // Or use a specific success variant if defined
      });
      // Remove query params from URL without reload
      router.replace(`/${lang}`, undefined); // Use router.replace, ensure lang is included
    }
    if (paymentCancel === "true") {
      toast({
        title: dictionary?.payment_cancelled_title || "Payment Cancelled",
        description: dictionary?.payment_cancelled_description || "Your payment process was cancelled.",
        variant: "destructive", // Or 'default'
      });
      // Remove query params from URL without reload
      router.replace(`/${lang}`, undefined); // Use router.replace, ensure lang is included
    }
  }, [searchParams, toast, router, lang, dictionary]); // Add lang and dictionary to dependencies

  const wasLoading = useRef(false);

  useEffect(() => {
    // Trigger refresh only after generation is done and successful
    if (wasLoading.current && !isLoading && result?.questions) {
      setUsageRefresh((r) => r + 1);
    }
    wasLoading.current = isLoading;
  }, [isLoading, result, setUsageRefresh]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    // Call usage endpoint first
    const usageRes = await fetch("http://localhost:5000/usage/use-model", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!usageRes.ok) {
      // Instead of alert, just set showPayment to true to show the plans page
      setShowPayment(true);
      return;
    }

    // Now proceed with generation
    const generateParams: GenerateQuestionsParams = {
      input,
      fileContent,
      questionType,
      questionCount,
      optionsCount,
      systemPrompt,
      correctAnswersCount,
      isRandomCorrectAnswers,
      minCorrectAnswers,
      maxCorrectAnswers,
      output: result?.questions,
      model: selectedModel, // Always DeepSeek
    };
    submit(generateParams);
  };
  // Function to handle purchasing credits
  // const handlePurchaseCredits = async () => {
  //   setIsCheckoutLoading(true);
  //   try {
  //     const response = await fetch("/api/stripe/checkout-session", {
  //       method: "POST",
  //     });

  //     const checkoutSession = await response.json();

  //     if (!response.ok || !checkoutSession.url) {
  //       console.error("Failed to create checkout session:", checkoutSession);
  //       toast({
  //         // Use toast for better UX
  //         variant: "destructive",
  //         title: dictionary?.payment_error_title || "Payment Error",
  //         description: checkoutSession.error || dictionary?.payment_initiate_error || "Could not initiate payment.",
  //       });
  //       setIsCheckoutLoading(false);
  //       return;
  //     }

  //     window.location.href = checkoutSession.url;
  //   } catch (err) {
  //     console.error("Error purchasing credits:", err);
  //     toast({
  //       variant: "destructive",
  //       title: dictionary?.error_title || "Error",
  //       description: dictionary?.unexpected_error_description || "An unexpected error occurred. Please try again.",
  //     });
  //     setIsCheckoutLoading(false);
  //   }
  // };

  const handleStop = () => {
    stop();
  };


  if (!dictionary) {
    return <LoadingState />;
  }

  if (sharedQuiz) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto relative">
        <InteractiveBackground />
        <DecorativeAccents />
        
        <div className="flex w-full justify-end items-center mb-8">
          <ModeToggle />
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 text-center relative inline-block">
            <span className="relative z-10">{dictionary.shared_quiz_title}</span>
            <div className="absolute bottom-0 left-0 h-4 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
          </h1>
          <p className="text-muted-foreground">{dictionary.shared_quiz_description}</p>
        </div>
        
        <QuestionList questions={sharedQuiz} lang={lang?.toString() as Locale ?? "en"} />
      </main>
    )
  }

  // Show payment plans if showPayment is true
  if (showPayment) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 text-center border-2 border-blue-200 dark:border-blue-800">
          <h2 className="text-3xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">Upgrade Your Access</h2>
          <p className="mb-8 text-blue-700 dark:text-blue-200 font-bold">Choose a plan to unlock unlimited AI usage and premium features.</p>
          <div className="grid grid-cols-1 gap-6">
            <div
              className="rounded-xl p-6 bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow-lg transform transition-transform hover:scale-105 cursor-pointer"
              onClick={() => router.push(`/en/plan/monthly`)}
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 1.343-3 3v1a3 3 0 006 0v-1c0-1.657-1.343-3-3-3z"/><path d="M5 20h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"/></svg>
              </div>
              <div className="font-bold text-lg mb-1 text-blue-800 dark:text-blue-100">Monthly Plan</div>
              <div className="text-3xl font-extrabold mb-2 text-blue-900 dark:text-blue-200">$9.99 <span className="text-base font-normal">/ month</span></div>
              <button
                onClick={e => { e.stopPropagation(); handlePay("monthly"); }}
                className="w-full py-2 mt-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg font-bold shadow hover:from-blue-600 hover:to-blue-800 transition"
              >
                Buy Monthly
              </button>
            </div>
            <div
              className="rounded-xl p-6 bg-gradient-to-br from-green-100 to-green-300 dark:from-green-900 dark:to-green-700 shadow-lg transform transition-transform hover:scale-105 cursor-pointer"
              onClick={() => router.push(`/en/plan/yearly`)}
            >
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-green-600 dark:text-green-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 1.343-3 3v1a3 3 0 006 0v-1c0-1.657-1.343-3-3-3z"/><path d="M5 20h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"/></svg>
              </div>
              <div className="font-bold text-lg mb-1 text-green-800 dark:text-green-100">Yearly Plan</div>
              <div className="text-3xl font-extrabold mb-2 text-green-900 dark:text-green-200">$99.99 <span className="text-base font-normal">/ year</span></div>
              <button
                onClick={e => { e.stopPropagation(); handlePay("yearly"); }}
                className="w-full py-2 mt-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg font-bold shadow hover:from-green-600 hover:to-green-800 transition"
              >
                Buy Yearly
              </button>
            </div>
          </div>
          <div className="text-blue-600 dark:text-blue-400 text-sm mt-8 font-semibold">After payment, your account will be upgraded automatically.</div>
        </div>
      </main>
    );
  }

  return (
      <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto relative">
          <InteractiveBackground />
          <DecorativeAccents />
          <div className="flex w-full justify-between items-center mb-4">
              {/* Remove UI that displays remaining generations */}
              {/* <div className="flex items-center gap-4">
                  {sessionStatus !== "loading" &&
                      remainingGenerations !== null && (
                          <div
                              className="flex items-center gap-1 text-sm text-muted-foreground border px-3 py-1.5 rounded-full shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                              title={dictionary.remaining_generations_tooltip}
                          >
                              <BrainCircuit className="h-4 w-4 text-[hsl(var(--themed-blue))]" />
                              <span className="font-medium">
                                  {remainingGenerations}
                              </span>
                          </div>
                      )}
              </div> */}
              <ModeToggle />
          </div>
          <AIDisclaimer />
          <div className="text-center mb-12">
              <div className="inline-block relative">
                  <h1 className="text-3xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">Questify</h1>
                  <div className="absolute bottom-1 left-0 h-4 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
              </div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">Generate quizzes from your notes, lectures, or documents. Free users get 5 tries.</p>
              <div className="text-gray-500 text-sm mt-8">Upgrade to a paid plan for unlimited access.</div>
          </div>
          <div className="mb-8">
              <div className="flex rounded-full p-1 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm shadow-inner mb-6">
                  <button
                      onClick={() => setActiveTab("content")}
                      className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
                          activeTab === "content"
                              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                      <span className="flex items-center justify-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{dictionary.tab_content}</span>
                      </span>
                  </button>
                  <button
                      onClick={() => setActiveTab("settings")}
                      className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
                          activeTab === "settings"
                              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                      <span className="flex items-center justify-center gap-2">
                          <Wand2 className="h-4 w-4" />
                          <span>{dictionary.tab_quiz_settings}</span>
                      </span>
                  </button>
              </div>

              {activeTab === "content" && (
                  <ThemedCard className="mb-6">
                      {/* Remove ThemedSectionTitle and Select for AI model selection */}
                      <ThemedSectionTitle>
                          <span className="flex items-center gap-2 text-blue-700 dark:text-blue-200 font-bold">
                              <Leaf className="h-5 w-5 text-[hsl(var(--themed-green))]" />
                              {dictionary.your_content_title}
                          </span>
                      </ThemedSectionTitle>
                      <FileUpload
                          onFileContent={setFileContent}
                          dictionary={dictionary}
                      />
                      <div className="mt-6">
                          <ExpandedTextarea
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder={dictionary.content_placeholder}
                          />
                      </div>
                  </ThemedCard>
              )}

              {activeTab === "settings" && (
                  <ThemedCard className="mb-6">
                      <ThemedSectionTitle>
                          <span className="flex items-center gap-2 text-blue-700 dark:text-blue-200 font-bold">
                              <Lightbulb className="h-5 w-5 text-[hsl(var(--themed-yellow))]" />
                              {dictionary.question_settings_title}
                          </span>
                      </ThemedSectionTitle>

                      <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <Label className="text-blue-700 dark:text-blue-200 font-bold">
                                      {dictionary.question_type_label}
                                  </Label>
                                  <Select
                                      onValueChange={(value) =>
                                          setQuestionType(
                                              value as
                                                  | "multiple-choice"
                                                  | "true-false"
                                                  | "short-answer"
                                                  | "mixed"
                                          )
                                      }
                                      value={questionType}
                                  >
                                      <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-[hsl(var(--ghibli-cream))] dark:border-gray-700 rounded-xl">
                                          <SelectValue
                                              placeholder={
                                                  dictionary.select_question_type_placeholder
                                              }
                                          />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="mixed">
                                              {dictionary.q_type_mixed}
                                          </SelectItem>
                                          <SelectItem value="multiple-choice">
                                              {
                                                  dictionary.q_type_multiple_choice
                                              }
                                          </SelectItem>
                                          <SelectItem value="true-false">
                                              {dictionary.q_type_true_false}
                                          </SelectItem>
                                          <SelectItem value="short-answer">
                                              {dictionary.q_type_short_answer}
                                          </SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-2">
                                  <Label className="text-blue-700 dark:text-blue-200 font-bold">
                                      {dictionary.number_of_questions_label}
                                  </Label>
                                  <NumberSelector
                                      value={questionCount}
                                      onChange={setQuestionCount}
                                      min={1}
                                      max={maxQuestions}
                                  />
                              </div>
                          </div>

                          {questionType === "multiple-choice" && (
                              <div className="space-y-6 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                  {/* Content for multiple choice settings */}
                                  <div className="space-y-2">
                                      <Label className="text-blue-700 dark:text-blue-200 font-bold">
                                          {dictionary.mc_options_count_label}
                                      </Label>
                                      <NumberSelector
                                          value={optionsCount}
                                          onChange={setOptionsCount}
                                          min={2}
                                          max={6}
                                      />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <Switch
                                          id="random-correct-answers"
                                          checked={isRandomCorrectAnswers}
                                          onCheckedChange={
                                              setIsRandomCorrectAnswers
                                          }
                                      />
                                      <Label
                                          htmlFor="random-correct-answers"
                                          className="text-blue-700 dark:text-blue-200 font-bold"
                                      >
                                          {dictionary.mc_random_correct_label}
                                      </Label>
                                  </div>
                                  {isRandomCorrectAnswers ? (
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label className="text-blue-700 dark:text-blue-200 font-bold">
                                                  {
                                                      dictionary.mc_min_correct_label
                                                  }
                                              </Label>
                                              <NumberSelector
                                                  value={minCorrectAnswers}
                                                  onChange={
                                                      setMinCorrectAnswers
                                                  }
                                                  min={1}
                                                  max={optionsCount - 1}
                                              />
                                          </div>
                                          <div className="space-y-2">
                                              <Label className="text-blue-700 dark:text-blue-200 font-bold">
                                                  {
                                                      dictionary.mc_max_correct_label
                                                  }
                                              </Label>
                                              <NumberSelector
                                                  value={maxCorrectAnswers}
                                                  onChange={
                                                      setMaxCorrectAnswers
                                                  }
                                                  min={minCorrectAnswers}
                                                  max={optionsCount - 1}
                                              />
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="space-y-2">
                                          <Label className="text-blue-700 dark:text-blue-200 font-bold">
                                              {
                                                  dictionary.mc_correct_count_label
                                              }
                                          </Label>
                                          <NumberSelector
                                              value={correctAnswersCount}
                                              onChange={setCorrectAnswersCount}
                                              min={1}
                                              max={optionsCount - 1}
                                          />
                                      </div>
                                  )}
                                  <div className="flex items-center space-x-2 pt-4">
                                      <Switch
                                          id="time-limit"
                                          checked={isTimeLimitEnabled}
                                          onCheckedChange={
                                              setIsTimeLimitEnabled
                                          }
                                      />
                                      <Label
                                          htmlFor="time-limit"
                                          className="text-blue-700 dark:text-blue-200 font-bold"
                                      >
                                          {dictionary.enable_time_limit_label}
                                      </Label>
                                  </div>
                                  {isTimeLimitEnabled && (
                                      <div className="space-y-2">
                                          <Label className="text-blue-700 dark:text-blue-200 font-bold">
                                              {dictionary.quiz_time_limit_label}
                                          </Label>
                                          <NumberSelector
                                              value={quizTimeLimit}
                                              onChange={setQuizTimeLimit}
                                              min={1}
                                              max={180} // Example max, adjust as needed
                                          />
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </ThemedCard>
              )}
          </div>{" "}
          {/* This closes the div with className="mb-8" */}
          <div className="mt-12 mb-8">
              {isLoading ? (
                  <Submit
                      onClick={handleStop}
                      loading={false} // The button itself is not in a loading state
                      primaryColor="red-600"
                      foregroundColor="white"
                      className="themed-button w-full py-4 px-6 text-lg font-medium rounded-xl bg-red-500 hover:bg-red-600"
                  >
                      {dictionary?.stop_generation_button || "Stop Generation"}
                  </Submit>
              ) : (
                  <>
                      {error && (
                          <div className="p-4 mb-4 text-base border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold">
                              <div className="opacity-90">
                                  <RateLimitError
                                      error={error}
                                      session={null} // Removed session prop
                                      handlePurchaseCredits={
                                          null // Removed handlePurchaseCredits prop
                                      }
                                      isCheckoutLoading={false} // Removed isCheckoutLoading prop
                                      priceString={null} // Removed priceString prop
                                      dictionary={dictionary}
                                  />
                              </div>
                          </div>
                      )}
                      <button
                          onClick={handleSubmit}
                          disabled={(!input && !fileContent) || isLoading} // isLoading will be false here
                          className="themed-button w-full py-4 px-6 text-lg font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <span className="flex items-center justify-center gap-2">
                              <Sparkles className="h-5 w-5" />
                              {dictionary?.generate_questions_button ||
                                  "Generate Questions"}
                          </span>
                      </button>
                  </>
              )}
          </div>
          {error &&
              !isLoading && ( // General error display, only if not loading (as RateLimitError handles errors when !isLoading)
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg font-bold">
                      <p className="font-semibold mb-1">
                          {dictionary.error_title}
                      </p>
                      <p>
                          {error.message ||
                              dictionary.unexpected_error_description}
                      </p>
                  </div>
              )}
          {result?.questions && result.questions.length > 0 && (
              <div className="mt-12">
                  <ThemedSectionTitle>
                      <span className="flex items-center gap-2 text-blue-700 dark:text-blue-200 font-bold">
                          <Sparkles className="h-5 w-5 text-[hsl(var(--themed-yellow))]" />
                          {dictionary.your_generated_quiz_title}
                      </span>
                  </ThemedSectionTitle>
                  <div className="flex justify-end gap-2 mb-4">
                      <ShareQuiz
                          questions={result.questions as Question[]}
                          lang={(lang?.toString() as Locale) ?? "en"}
                          dictionary={dictionary}
                          isLoading={isLoading}
                      />
                      <ExportQuestions
                          questions={result.questions as Question[]}
                          dictionary={dictionary}
                      />
                  </div>
                  <QuestionList
                      questions={result.questions as Question[]}
                      lang={(lang?.toString() as Locale) ?? "en"}
                  />
              </div>
          )}
      </main>
  );
}

// Suspense Boundary for the main content
export default function Page() {
    const [usageRefresh, setUsageRefresh] = useState(0);
    return (
        <RequireAuth>
            <UserUsage refresh={usageRefresh} />
            <Suspense fallback={<LoadingState />}> {/* Removed text prop if LoadingState doesn't accept it */}
                <QuizContent setUsageRefresh={setUsageRefresh} />
            </Suspense>
        </RequireAuth>
    );
}
