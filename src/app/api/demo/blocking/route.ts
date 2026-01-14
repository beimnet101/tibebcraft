import {generateText} from 'ai';
import {createGoogleGenerativeAI,google} from "@ai-sdk/google";


export async function POST(){
    const reponse=await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
return Response.json({reponse});
}
// import {generateText} from 'ai';
// import {anthropic} from "@ai-sdk/anthropic";


// export async function POST(){
//     const reponse=await generateText({
//    model: anthropic('claude-3-haiku-20240307'),
//   prompt: 'Write a vegetarian lasagna recipe for 4 people.',
// });
// return Response.json({reponse});
// }