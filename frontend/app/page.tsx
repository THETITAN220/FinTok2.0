"use client";

import { useState, useEffect, useRef } from "react";
import { transcribeAudio } from "@/app/utils/asr_translate";
import CustomAudioPlayer from "@/app/Components/AudioPlayer";
import LoanForm from "@/app/Components/Form"; // Import the LoanForm component

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<BlobPart[]>([]);
  const [chatHistory, setChatHistory] = useState<
    { userAudioUrl: string; aiAudioUrl: string | null; aiText: string | null; intent?: string | null }[]
  >([]);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        const userAudioUrl = URL.createObjectURL(audioBlob);

        setChatHistory((prevChat) => [
          ...prevChat,
          { userAudioUrl, aiAudioUrl: null, aiText: null },
        ]);

        try {
          const aiResponse = await transcribeAudio(audioBlob);
          if (aiResponse) {
            setChatHistory((prevChat) =>
              prevChat.map((chat, index) =>
                index === prevChat.length - 1
                  ? {
                      userAudioUrl: chat.userAudioUrl,
                      aiAudioUrl: aiResponse.audioUrl || null,
                      aiText: aiResponse.text || null,
                      intent: aiResponse.intent || null
                    }
                  : chat
              )
            );
            
            // Check if intent is loanApplication and show the form
            if (aiResponse.intent === "loanApplication") {
              setShowLoanForm(true);
            } else {
              setShowLoanForm(false);
            }
          }
        } catch (error) {
          console.error("Error processing AI response:", error);
        }

        audioChunks.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <div className="bg-indigo-600 text-white flex justify-between items-center px-6 py-4 shadow-lg">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight">FinTok 2.0</h1>
        </div>
        {/* <select className="bg-white text-indigo-900 px-4 py-2 rounded-md cursor-pointer border-2 border-indigo-300 font-medium text-sm transition-all hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option>Choose Model</option>
          <option>Finance</option>
          <option>Stocks</option>
          <option>Crypto</option>
        </select> */}
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Chat Section */}
        <main className="flex-1 flex flex-col p-6 bg-slate-100">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 bg-white shadow-xl rounded-xl max-h-[70vh] border border-slate-200"
          >
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                <p className="text-lg font-medium">Start a new conversation</p>
                <p className="text-sm mt-2">Click the record button below to begin speaking</p>
              </div>
            )}
            
            {chatHistory.map((chat, index) => (
              <div key={index} className="mb-6">
                {/* Recorded User Audio - Now on right side */}
                <div className="flex items-start mb-4 justify-end">
                  <div className="p-4 bg-indigo-50 text-white rounded-2xl rounded-tr-none w-fit max-w-lg shadow-sm">
                    <div className="text-xs text-indigo-200 mb-1">You</div>
                    <CustomAudioPlayer audioUrl={chat.userAudioUrl} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center ml-3 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                </div>

                {/* AI Response - Already on left side */}
                {(chat.aiAudioUrl || chat.aiText) && (
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      {chat.aiAudioUrl && (
                        <div className="p-4 bg-indigo-50 text-indigo-900 rounded-2xl rounded-tl-none w-fit max-w-lg shadow-sm mb-2">
                          <div className="text-xs text-indigo-500 mb-1">FinTok 2.0</div>
                          <CustomAudioPlayer audioUrl={chat.aiAudioUrl} />
                        </div>
                      )}

                      {chat.aiText && (
                        <div className="p-4 bg-indigo-50 text-indigo-900 rounded-2xl rounded-tl-none w-fit max-w-lg shadow-sm">
                          <div className="text-xs text-indigo-500 mb-1">FinTok 2.0</div>
                          <p>{chat.aiText}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Show Loan Form when intent is loanApplication */}
            {showLoanForm && (
              <div className="mt-6">
                <LoanForm />
              </div>
            )}
          </div>
          
          {/* Recording Controls */}
          <div className="mt-6 bg-white p-4 rounded-xl shadow-md border border-slate-200 flex items-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-6 py-3 font-semibold rounded-full text-white flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
              }`}
            >
              {isRecording ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Stop Recording
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                  </svg>
                  Start Recording
                </>
              )}
            </button>
            <p className="ml-4 text-slate-500 text-sm">
              {isRecording ? "Recording in progress..." : "Click to start recording your voice"}
            </p>
          </div>
        </main>
      </div>

      {/* Footer */}
      <div className="bg-indigo-900 text-indigo-200 py-2 px-6 text-xs flex items-center justify-between">
        <div>FinTok 2.0 © 2025 | Multilingual loan advisor</div>
        <div className="flex items-center">
          <span className="mr-2">AI Model:</span>
          <span className="text-white font-medium bg-indigo-800 px-2 py-1 rounded">Sarvam + Flash</span>
        </div>
      </div>
    </div>
  );
}

