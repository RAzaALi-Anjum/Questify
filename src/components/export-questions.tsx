import { Question } from "@/types/types";
import { Download, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExportQuestionsProps {
    questions: Question[];
    dictionary: any;
}

export function ExportQuestions({ questions, dictionary }: ExportQuestionsProps) {
    const { theme } = useTheme();
    const [isExporting, setIsExporting] = useState(false);

    // Helper to filter out answers/explanations if needed
    const filterQuestions = (questions: Question[], withAnswers: boolean) => {
        if (withAnswers) return questions;
        return questions.map(q => ({
            ...q,
            correctAnswer: undefined,
            why: undefined,
            hint: undefined,
        }));
    };

    const generateMarkdown = (questions: Question[], withAnswers: boolean): string => {
        let markdown = "# Quiz Questions\n\n";
        questions.forEach((question, index) => {
            markdown += `## ${index + 1}. ${question.question}\n\n`;
            if (question.type === "multiple-choice" && question.options) {
                question.options.forEach((option, optionIndex) => {
                    if (withAnswers) {
                        const isCorrect = Array.isArray(question.correctAnswer)
                            ? question.correctAnswer.includes(optionIndex)
                            : false;
                        const prefix = isCorrect ? "✅" : "❌";
                        markdown += `${prefix} **${String.fromCharCode(65 + optionIndex)}.** ${option}\n\n`;
                    } else {
                        markdown += `**${String.fromCharCode(65 + optionIndex)}.** ${option}\n\n`;
                    }
                });
            } else if (question.type === "true-false" && withAnswers) {
                markdown += `✅ **Correct Answer:** ${question.correctAnswer}\n\n`;
            } else if (question.type === "short-answer" && withAnswers) {
                markdown += `✅ **Expected Answer:** ${question.correctAnswer}\n\n`;
            }
            if (withAnswers && question.why) {
                markdown += `📖 **Explanation:** ${question.why}\n\n`;
            }
            if (question.page) {
                markdown += `📄 **Reference:** Page ${question.page}\n\n`;
            }
            if (withAnswers && question.hint) {
                markdown += `💡 **Hint:** ${question.hint}\n\n`;
            }
            markdown += "---\n\n";
        });
        return markdown;
    };

    const downloadMarkdown = (withAnswers: boolean) => {
        setIsExporting(true);
        try {
            const markdown = generateMarkdown(filterQuestions(questions, withAnswers), withAnswers);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = withAnswers ? 'quiz-questions-with-answers.md' : 'quiz-questions.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating markdown:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handlePDFExport = async (withAnswers: boolean) => {
        setIsExporting(true);
        try {
            const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            let yPosition = margin;
            const checkNewPage = (requiredHeight: number) => {
                if (yPosition + requiredHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                    return true;
                }
                return false;
            };
            const addText = (text: string, x: number, y: number, options: any = {}) => {
                const lines = pdf.splitTextToSize(text, maxWidth - (x - margin));
                const lineHeight = options.lineHeight || 6;
                checkNewPage(lines.length * lineHeight);
                pdf.text(lines, x, yPosition);
                yPosition += lines.length * lineHeight;
                return lines.length;
            };
            pdf.setFontSize(24);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(51, 51, 51);
            pdf.text("Quiz Questions", pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;
            filterQuestions(questions, withAnswers).forEach((question, index) => {
                checkNewPage(25);
                pdf.setFontSize(16);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(37, 99, 235);
                const questionNumber = `${index + 1}.`;
                pdf.text(questionNumber, margin, yPosition);
                pdf.setTextColor(51, 51, 51);
                const questionTextWidth = maxWidth - 15;
                const questionLines = pdf.splitTextToSize(question.question || 'No question text', questionTextWidth);
                if (yPosition + (questionLines.length * 7) > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                    pdf.text(questionNumber, margin, yPosition);
                }
                pdf.text(questionLines, margin + 15, yPosition);
                yPosition += questionLines.length * 7 + 8;
                if (question.type === "multiple-choice" && question.options) {
                    pdf.setFontSize(12);
                    question.options.forEach((option, optionIndex) => {
                        let isCorrect = false;
                        if (withAnswers) {
                            isCorrect = Array.isArray(question.correctAnswer)
                                ? question.correctAnswer.includes(optionIndex)
                                : false;
                        }
                        const optionLines = pdf.splitTextToSize(`${String.fromCharCode(65 + optionIndex)}. ${option}`, maxWidth - 25);
                        checkNewPage(optionLines.length * 5 + 3);
                        if (withAnswers) {
                            if (isCorrect) {
                                pdf.setFont("helvetica", "bold");
                                pdf.setTextColor(34, 197, 94);
                                pdf.text("[X]", margin + 5, yPosition);
                            } else {
                                pdf.setFont("helvetica", "normal");
                                pdf.setTextColor(107, 114, 128);
                                pdf.text("[ ]", margin + 5, yPosition);
                            }
                        }
                        pdf.setTextColor(51, 51, 51);
                        pdf.text(optionLines, margin + 15, yPosition);
                        yPosition += optionLines.length * 5 + 3;
                    });
                    yPosition += 5;
                } else if (question.type === "true-false" && withAnswers) {
                    checkNewPage(15);
                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(34, 197, 94);
                    pdf.text("✓", margin + 5, yPosition);
                    pdf.setTextColor(51, 51, 51);
                    addText(`Correct Answer: ${question.correctAnswer?.toString() || 'N/A'}`, margin + 15, yPosition, { lineHeight: 6 });
                    yPosition += 8;
                } else if (question.type === "short-answer" && withAnswers) {
                    checkNewPage(15);
                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(34, 197, 94);
                    pdf.text("✓", margin + 5, yPosition);
                    pdf.setTextColor(51, 51, 51);
                    addText(`Expected Answer: ${question.correctAnswer || 'N/A'}`, margin + 15, yPosition, { lineHeight: 6 });
                    yPosition += 8;
                }
                if (withAnswers && question.why) {
                    checkNewPage(20);
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(107, 114, 128);
                    pdf.text("Explanation:", margin + 5, yPosition);
                    pdf.setFont("helvetica", "italic");
                    addText(`${question.why ?? 'N/A'}`, margin + 35, yPosition, { lineHeight: 6 });
                    yPosition += 5;
                }
                if (question.page) {
                    checkNewPage(10);
                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(99, 102, 241);
                    pdf.text("Reference:", margin + 5, yPosition);
                    addText(`Page ${question.page}`, margin + 35, yPosition, { lineHeight: 5 });
                    yPosition += 3;
                }
                if (withAnswers && question.hint) {
                    checkNewPage(15);
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(245, 158, 11);
                    pdf.text("Hint:", margin + 5, yPosition);
                    pdf.setTextColor(107, 114, 128);
                    pdf.setFont("helvetica", "italic");
                    addText(`${question.hint ?? 'N/A'}`, margin + 25, yPosition, { lineHeight: 6 });
                    yPosition += 5;
                }
                yPosition += 8;
                checkNewPage(15);
                if (index < questions.length - 1) {
                    pdf.setDrawColor(229, 231, 235);
                    pdf.setLineWidth(0.3);
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 15;
                }
            });
            const pageCount = (pdf as any).internal.pages.length - 1;
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(156, 163, 175);
                pdf.text(
                    `Generated by Questify | Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
            pdf.save(withAnswers ? 'quiz-questions-with-answers.pdf' : 'quiz-questions.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSelection = (value: string) => {
        if (value === "pdf-questions") {
            handlePDFExport(false);
        } else if (value === "pdf-answers") {
            handlePDFExport(true);
        } else if (value === "markdown-questions") {
            downloadMarkdown(false);
        } else if (value === "markdown-answers") {
            downloadMarkdown(true);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Download className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" className={isExporting ? "animate-bounce" : ""}>
                        {isExporting ? (dictionary.export_loading || "Exporting...") : (dictionary.export_button || "Export")}
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExportSelection("pdf-questions") } disabled={isExporting}>
                        {dictionary.export_pdf_questions || "Export PDF (Questions Only)"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportSelection("pdf-answers") } disabled={isExporting}>
                        {dictionary.export_pdf_answers || "Export PDF (With Answers)"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportSelection("markdown-questions") } disabled={isExporting}>
                        {dictionary.export_md_questions || "Export Markdown (Questions Only)"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportSelection("markdown-answers") } disabled={isExporting}>
                        {dictionary.export_md_answers || "Export Markdown (With Answers)"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
