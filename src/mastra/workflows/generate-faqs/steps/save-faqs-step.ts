import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { faqsOutputSchema } from "../../../schemas/faqs-types";
import { writeFileTool } from "../../../tools/write-file";

export const saveFaqsStep = createStep({
  id: "save-faqs",
  description: "Write generated FAQs to a .txt file",
  inputSchema: faqsOutputSchema.extend({
    outputDirectory: z.string().describe("Directory to write the .txt file"),
  }),
  outputSchema: faqsOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    const { productTitle, faqs, totalFaqs, outputDirectory } = inputData;

    const lines: string[] = [
      `FAQs — ${productTitle}`,
      `Generated: ${new Date().toISOString()}`,
      `Total: ${totalFaqs}`,
      "",
    ];

    faqs.forEach((faq, i) => {
      lines.push(`Q${i + 1}: ${faq.question}`);
      lines.push(`A${i + 1}: ${faq.answer}`);
      lines.push("");
    });

    const content = lines.join("\n");
    const filePath = `${outputDirectory}/faqs.txt`;

    console.log(`💾 Saving FAQs to ${filePath}...`);

    const result = await writeFileTool.execute!(
      { filePath, content, encoding: "utf8", createDirectories: true },
      { requestContext, mastra },
    );

    if (!result || !result.success) {
      throw new Error(`Failed to write FAQs file: ${result?.message ?? "Unknown error"}`);
    }

    console.log(`✅ Saved ${result.bytesWritten} bytes to ${filePath}`);

    return { productTitle, faqs, totalFaqs, filePath };
  },
});
