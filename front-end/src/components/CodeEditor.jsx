import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';

const CodeEditor = () => {
    const { id: meetingId } = useParams();
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('// Welcome!');
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const editorRef = useRef(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        let timeoutId;

        const fetchCodeHistory = async () => {
            try {
                setError(null);
                const response = await fetch(`http://localhost:8080/code/${meetingId}`); // TODO: Change to your server
                if (!response.ok) {
                    throw new Error('Failed to fetch code history');
                }
                const history = await response.json();
                if (history.length > 0) {
                    const lastUpdate = history[history.length - 1];
                    setCode(lastUpdate.data.code);
                    setLanguage(lastUpdate.data.language);
                }
            } catch (error) {
                console.error('Error fetching code history:', error);
                setError('Failed to load code history');
                // Retry after 5 seconds
                timeoutId = setTimeout(fetchCodeHistory, 5000);
            }
        };

        const setupSSE = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const eventSource = new EventSource(`http://localhost:8080/code/${meetingId}/stream`); // TODO: Change to your server

            eventSource.onopen = () => {
                console.log('SSE connection established');
                setError(null);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.service === 'code') {
                        setCode(data.data.code);
                        setLanguage(data.data.language);
                    }
                } catch (error) {
                    console.error('Error processing SSE message:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE Error:', error);
                setError('Connection lost. Retrying...');
                eventSource.close();
                // Retry after 5 seconds
                timeoutId = setTimeout(setupSSE, 5000);
            };

            eventSourceRef.current = eventSource;
        };

        fetchCodeHistory();
        setupSSE();

        // Cleanup function
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [meetingId]);

    const sendCodeUpdate = async (newCode) => {
        try {
            const response = await fetch(`http://localhost:8080/code/${meetingId}`, { // TODO: Change to your server
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: newCode,
                    language
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send code update');
            }
        } catch (error) {
            console.error('Error sending code update:', error);
            setError('Failed to sync code changes');
        }
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    const debouncedCodeUpdate = (newCode) => {
        if (window.codeUpdateTimeout) {
            clearTimeout(window.codeUpdateTimeout);
        }
        window.codeUpdateTimeout = setTimeout(() => {
            sendCodeUpdate(newCode);
        }, 1000); // Increased debounce time to 1 second
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        debouncedCodeUpdate(newCode);
    };

    const runCode = () => {
        let output = '';
        const originalLog = console.log;
        console.log = (...args) => {
            output += args.map(String).join(' ') + '\n';
        };
        try {
            const wrappedCode = `(function() { ${code} })()`;
            eval(wrappedCode);
            setOutput(output || 'Code executed successfully, but produced no output.');
        } catch (error) {
            setOutput(error.toString());
        } finally {
            console.log = originalLog;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between p-2 bg-gray-800">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-700 text-white p-2 rounded"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                </select>
                <button
                    onClick={runCode}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                    Run Code
                </button>
            </div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2">
                    {error}
                </div>
            )}
            <Editor
                height="70%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    automaticLayout: true,
                }}
            />
            <div className="h-[30%] w-full bg-gray-900 text-white p-4 overflow-auto">
                <h3 className="text-xl mb-2">Output:</h3>
                <pre>{output}</pre>
            </div>
        </div>
    );
};

export default CodeEditor;