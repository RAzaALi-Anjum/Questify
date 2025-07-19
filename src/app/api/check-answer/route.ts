import { z } from "zod";

export async function POST(req: Request) {
    try {
        const { userAnswer, correctAnswer } = await req.json();

        const systemPrompt = `You are an advanced quiz grader. Your task is to compare the student's answer with the correct answer and provide a percentage score (0-100) indicating how correct the student's answer is. Also, provide a brief explanation, addressing the user as 'student', of why you assigned that score. Consider the following scoring guide:\n\n- 100%: The student's answer is completely correct and matches the meaning of the correct answer perfectly.\n- 75-99%: The student's answer is mostly correct but has minor flaws or omissions.\n- 50-74%: The student's answer is partially correct but misses significant aspects of the correct answer.\n- 25-49%: The student's answer contains some relevant information but is largely incorrect.\n- 0-24%: The student's answer is completely incorrect or irrelevant.\n\nFocus on the core meaning and key details. Provide the percentage and justification in the 'score' and 'reason' fields respectively. Address the user as 'student' in the 'reason' field. Respond in JSON: { "score": number, "reason": string }`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Questify/1.0)',
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat-v3-0324:free',
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    {
                        role: "user",
                        content: `Correct answer: "${correctAnswer}"
Student answer: "${userAnswer}"`,
                    },
                ],
                temperature: 0.1,
                max_tokens: 200,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ error: `API Error: ${response.statusText} - ${errorText}` }), { status: 500 });
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim() || '';
        if (content.startsWith('```')) {
            content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        }
        let score = null;
        let reason = '';
        try {
            const parsed = JSON.parse(content);
            score = parsed.score;
            reason = parsed.reason;
        } catch (e) {
            reason = 'Failed to parse model response.';
        }
        return Response.json({ score, reason });
    } catch (error) {
        console.error("Error checking answer:", error);
        return Response.json({ error: "Failed to check answer" }, { status: 500 });
    }
}
