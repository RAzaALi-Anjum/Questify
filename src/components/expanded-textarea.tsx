"use client";

import type React from "react";

import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface ExpandedTextareaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}

export function ExpandedTextarea({
    value,
    onChange,
    placeholder,
}: ExpandedTextareaProps) {

    return (
        <div className="relative">
            <div
                className="relative"
            >
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full rounded-xl border-2 border-blue-300 focus:border-blue-500 dark:border-blue-700 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-neutral-700 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 shadow-sm transition-[height] duration-300 ease-in-out will-change-[height] h-32 p-4`}
                />
            </div>
        </div>
    );
}
