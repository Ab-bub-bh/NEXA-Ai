
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

import { exec } from "child_process";


const app = express();
app.use(cors());
app.use(express.json());

app.post("/cricket" , async (req , res) =>
{
    try{
        const {message} = req.body;
        if(!message) {
            return res.status(400).json({error:"Message required"});
        }
        const cricketResponse = await fetch(`https://cricapi.com/api/cricket?apikey=${Cricket_API_KEY}`);
        const  cricketData = await cricketData.json();


        const match = cricketData.data.find(m => m.teams?.some(team => message.tolow) )
    }
}
