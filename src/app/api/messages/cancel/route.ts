import {promise, success, z} from "zod";
import { NextResponse } from "next/server";

import {auth} from "@clerk/nextjs/server";

import { inngest } from "@/inngest/client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { error } from "node:console";
import { convex } from "@/lib/convex-client";

const requestSchema=z.object({
    projectId:z.string(),

});

export async function POST(request:Request){

    const {userId}=await auth();
    if(!userId){
        return NextResponse.json({error:"unAuthorized"},{status:401});
    }
     const body=await request.json();
     const {projectId}=requestSchema.parse(body);
     const internalKey=process.env.TIBEBCRAFT_CONVEX_INTERNAL_KEY!
     
     if(!internalKey){
        return NextResponse.json({
            error:"internal key not configured",
            
        },
    {
        status:500
    })
     }

        //find all processing message in this project

        const processingMessage=await convex.query(api.system.getProcessingMessages,{
            internalKey,
            projectId:projectId as Id<"projects">
        });

       if (processingMessage.length===0){
        return NextResponse.json({success:true,cancelled:false});
       }

       //cancel proccessing message

       const cancelledIds=await Promise.all(

        processingMessage.map(async(msg)=>{
            await inngest.send({
                name:"message/cancel",
                data:{
                    messageId:msg._id
                }
            })

            await convex.mutation(api.system.updateMessageStatus,{
                internalKey,
                messageId:msg._id,
                status:"cancelled"



            })
            return msg._id;
        })
       )
    return NextResponse.json({
        success:true,
        cancelled:true,
        messageIds:cancelledIds
    })

}


