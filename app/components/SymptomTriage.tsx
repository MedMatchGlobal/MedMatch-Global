'use client';

import { useState } from 'react';
import { askGPT } from '../utils/gpt'; // Corrected import

export default function SymptomTriage() {
  const [conversation, setConversation] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [initialSymptom, setInitialSymptom] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUserSubmit = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    const updatedHistory = [...conversation, `User: ${userInput}`];

    try {
      const response = await askGPT(initialSymptom, updatedHistory);

      setConversation([
        ...updatedHistory,
        response
          ? `AI: ${response}`
          : `AI: Sorry, I couldn't understand that. Please try again.`
      ]);

      if (
        response?.toLowerCase().includes('recommendation') ||
        response?.toLowerCase().includes('you should now')
      ) {
        setIsFinished(true);
      }

      setUserInput('');
    } catch (error) {
      console.error('Triage error:', error);
      setConversation([
        ...updatedHistory,
        'AI: An error occurred while processing your request. Please try again later.'
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 max-w-xl mx-auto px-4 text-sm">
      {initialSymptom ? (
        <div>
          {conversation.map((line, idx) => (
            <p key={idx} className="mb-2 whitespace-pre-wrap">{line}</p>
          ))}

          {!isFinished && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserSubmit();
              }}
              className="mt-4 flex flex-col gap-2"
            >
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add more details or context..."
                className="p-2 border border-gray-300 rounded"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-2 rounded disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Send'}
              </button>
            </form>
          )}

          {isFinished && (
            <p className="mt-4 font-semibold text-green-700">
              ✅ Thanks! This concludes your triage session.
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setInitialSymptom(userInput);
            setConversation([`User: ${userInput}`]);
            setUserInput('');
          }}
          className="flex flex-col gap-3"
        >
          <h2 className="font-semibold mb-2">Describe your symptom</h2>
          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g. My ankle hurts"
            className="p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={!userInput.trim()}
            className="bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            Start Triage
          </button>
        </form>
      )}
    </div>
  );
}
