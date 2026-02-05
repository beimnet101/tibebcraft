import { createAgent, anthropic, createNetwork, gemini } from '@inngest/agent-kit';

import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { 
  CODING_AGENT_SYSTEM_PROMPT, 
  TITLE_GENERATOR_SYSTEM_PROMPT
} from "./constants";
import { createListFilesTool } from './tools/list-files';
import { createReadFilesTool } from './tools/read-file';
import { DEFAULT_CONVERSATION_TITLE } from '../constant';
import { createUpdateFileTool } from './tools/update-file';
import { createCreateFilesTool } from './tools/create-files';
import { createCreateFolderTool } from './tools/create-folder';
import { createRenameFileTool } from './tools/rename-file';
import { createDeleteFilesTool } from './tools/delete-file';
import { createScrapeUrlsTool } from './tools/scrape-urls';

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
};

// export const processMessage = inngest.createFunction(
//   {
//     id: "process-message",
//     cancelOn: [
//       {
//         event: "message/cancel",
//         if: "event.data.messageId == async.data.messageId",
//       },
//     ],
//     onFailure: async ({ event, step }) => {
//       const { messageId } = event.data.event.data as MessageEvent;
//       const internalKey = process.env.TIBEBCRAFT_CONVEX_INTERNAL_KEY;

//       // Update the message with error content
//       if (internalKey) {
//         await step.run("update-message-on-failure", async () => {
//           await convex.mutation(api.system.updateMessageContent, {
//             internalKey,
//             messageId,
//             content:
//               "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
//           });
//         });
//       }
//     }
//   },
//   {
//     event: "message/sent",
//   },
//   async ({ event, step }) => {
//     const { 
//       messageId, 
//       conversationId,
//       projectId,
//       message
//     } = event.data as MessageEvent;

//     const internalKey = process.env.TIBEBCRAFT_CONVEX_INTERNAL_KEY; 

//     if (!internalKey) {
//       throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
//     }

//     // TODO: Check if this is needed
//     await step.sleep("wait-for-db-sync", "1s");

//     // Get conversation for title generation check
//     const conversation = await step.run("get-conversation", async () => {
//       return await convex.query(api.system.getConversationById, {
//         internalKey,
//         conversationId,
//       });
//     });

//     if (!conversation) {
//       throw new NonRetriableError("Conversation not found");
//     }

//     // Fetch recent messages for conversation context
//     const recentMessages = await step.run("get-recent-messages", async () => {
//       return await convex.query(api.system.getRecentMessages, {
//         internalKey,
//         conversationId,
//         limit: 10,
//       });
//     });

//     // Build system prompt with conversation history (exclude the current processing message)
//     let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

//     // Filter out the current processing message and empty messages
//     const contextMessages = recentMessages.filter(
//       (msg) => msg._id !== messageId && msg.content.trim() !== ""
//     );

//     if (contextMessages.length > 0) {
//       const historyText = contextMessages
//         .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
//         .join("\n\n");

//       systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
//     }

//     // Generate conversation title if it's still the default
//     const shouldGenerateTitle =
//       conversation.title === DEFAULT_CONVERSATION_TITLE;

//     if (shouldGenerateTitle) {
//        const titleAgent = createAgent({
//         name: "title-generator",
//         system: TITLE_GENERATOR_SYSTEM_PROMPT,
//         model: gemini({
//           model: "gemini-1.5-flash",
//           apiKey:process.env.GOOGLE_GENERATIVE_AI_API_KEY!
//           //defaultParameters: { temperature: 0, max_tokens: 50 },
//         }),
//        });

//        const { output } = await titleAgent.run(message, { step });

//        const textMessage = output.find(
//         (m) => m.type === "text" && m.role === "assistant"
//       );

//       if (textMessage?.type === "text") {
//          const title = 
//           typeof textMessage.content === "string"
//             ? textMessage.content.trim()
//             : textMessage.content
//               .map((c) => c.text)
//               .join("")
//               .trim();

//         if (title) {
//           await step.run("update-conversation-title", async () => {
//             await convex.mutation(api.system.updateConversationTitle, {
//               internalKey,
//               conversationId,
//               title,
//             });
//           });
//         }
//       }
//     }

//     // Create the coding agent with file tools
//     const codingAgent = createAgent({
//       name: "polaris",
//       description: "An expert AI coding assistant",
//       system: systemPrompt,
//      model: gemini({
//           model:"gemini-2.5-flash",
//           apiKey:process.env.GOOGLE_GENERATIVE_AI_API_KEY!
//           //defaultParameters: { temperature: 0, max_tokens: 50 },
//         }),
//        tools: [
//         createListFilesTool({ internalKey, projectId }),
//         createReadFilesTool({ internalKey }),
//         // createUpdateFileTool({ internalKey }),
//         // createCreateFilesTool({ projectId, internalKey }),
//         // createCreateFolderTool({ projectId, internalKey }),
//         // createRenameFileTool({ internalKey }),
//         // createDeleteFilesTool({ internalKey }),
//         // createScrapeUrlsTool(),
//        ],
//     });

//     // Create network with single agent
//     // const network = createNetwork({
//     //   name: "tibebe-network",
//     //   agents: [codingAgent],
//     //   maxIter: 20,
//     //   router: ({ network }) => {
//     //     const lastResult = network.state.results.at(-1);
//     //     const hasTextResponse = lastResult?.output.some(
//     //       (m) => m.type === "text" && m.role === "assistant"
//     //     );
//     //     const hasToolCalls = lastResult?.output.some(
//     //       (m) => m.type === "tool_call"
//     //     );

//     //     // Anthropic outputs text AND tool calls together
//     //     // Only stop if there's text WITHOUT tool calls (final response)
//     //     if (hasTextResponse && !hasToolCalls) {
//     //       return undefined;
//     //     }
//     //     return codingAgent;
//     //   }
//     // });
// const network = createNetwork({
//   name: "tibebe-network",
//   agents: [codingAgent],
//   maxIter: 20,
//   router: ({ network }) => {
//     const lastResult = network.state.results.at(-1);

//     // Stop the network as soon as the agent returns ANY text
//     const hasTextResponse = lastResult?.output.some(
//       (m) => m.type === "text" && m.role === "assistant"
//     );

//     if (hasTextResponse) {
//       return undefined; // stop network
//     }

//     // Otherwise, continue with the same agent
//     return codingAgent;
//   }
// });

//     // Run the agent
//     const result = await network.run(message);

//     // Extract the assistant's text response from the last agent result
//     const lastResult = result.state.results.at(-1);
//     const textMessage = lastResult?.output.find(
//       (m) => m.type === "text" && m.role === "assistant"
//     );

//     let assistantResponse =
//       "I processed your request. Let me know if you need anything else!";

//     if (textMessage?.type === "text") {
//       assistantResponse =
//         typeof textMessage.content === "string"
//           ? textMessage.content
//           : textMessage.content.map((c) => c.text).join("");
//     }

//     // Update the assistant message with the response (this also sets status to completed)
//     await step.run("update-assistant-message", async () => {
//       await convex.mutation(api.system.updateMessageContent, {
//         internalKey,
//         messageId,
//         content: assistantResponse,
//       })
//     });

//     return { success: true, messageId, conversationId };
//   }
// );
export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = process.env.TIBEBCRAFT_CONVEX_INTERNAL_KEY;
      console.log("[onFailure] internalKey:", !!internalKey);

      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          console.log("[onFailure] updating message content...");
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
          });
          console.log("[onFailure] message update complete");
        });
      }
    }
  },
  { event: "message/sent" },
  async ({ event, step }) => {
    const { messageId, conversationId, projectId, message } = event.data as MessageEvent;
    const internalKey = process.env.TIBEBCRAFT_CONVEX_INTERNAL_KEY;

    console.log("[start] processMessage", { messageId, conversationId, projectId });
    if (!internalKey) throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");

    console.log("[step] sleeping for DB sync...");
    await step.sleep("wait-for-db-sync", "1s");
    console.log("[step] sleep complete");

    // Get conversation
    const conversation = await step.run("get-conversation", async () => {
      console.log("[step] fetching conversation...");
      const conv = await convex.query(api.system.getConversationById, { internalKey, conversationId });
      console.log("[step] conversation fetched:", conv ? "found" : "not found");
      return conv;
    });
    if (!conversation) throw new NonRetriableError("Conversation not found");

    // Fetch recent messages
    const recentMessages = await step.run("get-recent-messages", async () => {
      console.log("[step] fetching recent messages...");
      const msgs = await convex.query(api.system.getRecentMessages, { internalKey, conversationId, limit: 10 });
      console.log("[step] recent messages fetched:", msgs.length);
      return msgs;
    });

    // Build system prompt
    console.log("[step] building system prompt...");
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;
    const contextMessages = recentMessages.filter(msg => msg._id !== messageId && msg.content.trim() !== "");
    if (contextMessages.length > 0) {
      const historyText = contextMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n");
      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below.`;
    }
    console.log("[step] system prompt built");

    // Generate title if default
    const shouldGenerateTitle = conversation.title === DEFAULT_CONVERSATION_TITLE;
    if (shouldGenerateTitle) {
      console.log("[step] generating conversation title...");
      const titleAgent = createAgent({
        name: "title-generator",
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: gemini({ model: "gemini-2.5-pro", apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! }),
      });

      const { output } = await titleAgent.run(message, { step });
      console.log("[step] titleAgent output:", output);

      const textMessage = output.find(m => m.type === "text" && m.role === "assistant");
      if (textMessage?.type === "text") {
        const title = typeof textMessage.content === "string" ? textMessage.content.trim() : textMessage.content.map(c => c.text).join("").trim();
        console.log("[step] generated title:", title);
        if (title) {
          await step.run("update-conversation-title", async () => {
            console.log("[step] updating conversation title...");
            await convex.mutation(api.system.updateConversationTitle, { internalKey, conversationId, title });
            console.log("[step] conversation title updated");
          });
        }
      }
    }

    // Create coding agent
    console.log("[step] creating coding agent...");
    const codingAgent = createAgent({
      name: "polaris",
      description: "An expert AI coding assistant",
      system: systemPrompt,
      model: gemini({ model: "gemini-2.5-pro", apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! }),
      tools: [
        createListFilesTool({ internalKey, projectId }),
        createReadFilesTool({ internalKey }),
        createUpdateFileTool({internalKey}),
        createCreateFilesTool({projectId,internalKey}),
        createCreateFolderTool({projectId,internalKey}),
        createRenameFileTool({internalKey}),
        createDeleteFilesTool({internalKey}),
        createScrapeUrlsTool(),
      ],
    });
    console.log("[step] coding agent created");

    // Create network
    console.log("[step] creating network...");
    const network = createNetwork({
      name: "tibebe-network",
      agents: [codingAgent],
      maxIter: 20,
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.some(m => m.type === "text" && m.role === "assistant");
        return hasTextResponse ? undefined : codingAgent;
      },
    });
    console.log("[step] network created, running network...");

    // Run network
    const result = await network.run(message);
    console.log("[step] network run complete");

    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output.find(m => m.type === "text" && m.role === "assistant");
    let assistantResponse = "I processed your request. Let me know if you need anything else!";
    if (textMessage?.type === "text") {
      assistantResponse = typeof textMessage.content === "string" ? textMessage.content : textMessage.content.map(c => c.text).join("");
    }
    console.log("[step] assistant response prepared:", assistantResponse);

    // Update assistant message
    await step.run("update-assistant-message", async () => {
      console.log("[step] updating assistant message in DB...");
      await convex.mutation(api.system.updateMessageContent, { internalKey, messageId, content: assistantResponse });
      console.log("[step] assistant message updated");
    });

    console.log("[end] processMessage completed successfully");
    return { success: true, messageId, conversationId };
  }
);
