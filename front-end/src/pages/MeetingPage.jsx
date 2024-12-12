import React, { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaCommentDots, FaUser, FaPen, FaCode, FaDoorClosed, FaDoorOpen, FaMeetup } from 'react-icons/fa';
import { MdScreenShare } from 'react-icons/md';
import VideoBox from "../components/VideoBox";
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import '../assets/meeting.css';

import { v4 as uuidv4 } from 'uuid';

import { getAllMessages, listenForNewMessages, partialEditMessage, sendDataToMeetingRoom, getMeeting, joinAsParticipant } from '../services/firebaseApi';

import Chat from "../components/Chat";
import CodeEditor from "../components/CodeEditor";
import Whiteboard from "../components/Whiteboard";

function MeetingPage() {
    const navigate = useNavigate();

    const jwtToken = localStorage.getItem('token');
    const [isLoggedIn, setIsLoggedIn] = React.useState(jwtToken && true);
    const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);

    const [dataStreamingMessages, setDataStreamingMessages] = React.useState([]);

    const { id: meetingId } = useParams();

    const generatedUUID = uuidv4();
    const [RTCClientId, setRTCClientId] = React.useState(generatedUUID);

    const [isAudioOn, setIsAudioOn] = React.useState(false);
    const [isCameraOn, setIsCameraOn] = React.useState(false);

    // other
    const [isOtherAudioOn, setIsOtherAudioOn] = React.useState(false);
    const [isOtherCameraOn, setIsOtherCameraOn] = React.useState(false);

    const [userStream, setUserStream] = React.useState(null);
    const [remoteStream, setRemoteStream] = React.useState(null);
    const peerConnection = useRef(null);
    const offerSentRef = useRef(false);

    const [connected, setConnected] = React.useState(false);

    const [chatVisible, setChatVisible] = React.useState(true);

    const [editorVisible, setEditorVisible] = React.useState(false);
    const [whiteboardVisible, setWhiteboardVisible] = React.useState(false);
    const [screenshareVisible, setScreenshareVisible] = React.useState(false);
    const [videoVisible, setVideoVisible] = React.useState(true);

    const candidateQueue = useRef([]);



    const chatRef = useRef(null);

    const toggleAudio = () => {
        if (userStream) {
            const audioTracks = userStream.getAudioTracks();
            console.log('Audio tracks:', audioTracks);
            console.log('audio on previously:', isAudioOn);
            audioTracks.forEach(track => {
                track.enabled = !isAudioOn;
                console.log(`Track ${track.label} enabled: ${track.enabled}`);
            });

            sendDataToMeetingRoom(meetingId, 'video', {
                type: 'audio-visibility',
                newVisibility: !isAudioOn,
                clientId: RTCClientId
            });
        }
        setIsAudioOn(!isAudioOn);
    };

    useEffect(() => {
        if (remoteStream) {
            remoteStream.getVideoTracks().forEach(track => {
                track.enabled = remoteVideoEnabled;
            });
        }
    }, [remoteStream, remoteVideoEnabled]);

    const toggleVideo = () => {
        if (userStream) {
            const videoTracks = userStream.getVideoTracks();
            console.log('Video tracks:', videoTracks);
            console.log('camera on previously:', isCameraOn);
            videoTracks.forEach(track => {
                track.enabled = !isCameraOn;
                console.log(`Track ${track.label} enabled: ${track.enabled}`);
            });
    
            sendDataToMeetingRoom(meetingId, 'video', {
                type: 'video-visibility',
                newVisibility: !isCameraOn,
                clientId: RTCClientId,
            });
        }
    
        setIsCameraOn(!isCameraOn);
    };

    const toggleChat = () => {
        setChatVisible(!chatVisible);
    };

    const toggleMeeting = () => {
        setVideoVisible(true);
        setWhiteboardVisible(false);
        setEditorVisible(false);
        setScreenshareVisible(false);
    };

    const toggleWhiteboard = () => {
        setWhiteboardVisible(true);
        setEditorVisible(false);
        setScreenshareVisible(false);
        setVideoVisible(false);
    };

    const toggleScreenshare = () => {
        setScreenshareVisible(true);
        setWhiteboardVisible(false);
        setEditorVisible(false);
        setVideoVisible(false);
    };

    const toggleEditor = () => {
        setEditorVisible(true);
        setWhiteboardVisible(false);
        setScreenshareVisible(false);
        setVideoVisible(false);
    };

    const handleLeave = async () => {
        try {
            // Stop media tracks if they exist
            if (userStream) {
                userStream.getTracks().forEach(track => {
                    track.stop();
                });
            }

            const userId = localStorage.getItem('userId');

            // End meeting in MongoDB
            await fetch(`${import.meta.env.VITE_API_URL}/meeting/${meetingId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`,
                    'UserId': userId
                }
            });

            // Close event source if it exists
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            // Close peer connection if it exists
            if (peerConnection.current) {
                peerConnection.current.close();
            }

            // Navigate to join/create page using the imported navigate function
            navigate('/joincreatemeeting');
        } catch (error) {
            console.error('Error leaving meeting:', error);
            // Still navigate away even if saving fails
            navigate('/joincreatemeeting');
        }
    };

    const initializeVideoConnection = async (messages) => {

        // create a new RTCPeerConnection
        const configuration = {
            iceServers: [
                {
                    urls: [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302'
                    ]
                }
            ],
            iceCandidatePoolSize: 10
        };

        const pc = new RTCPeerConnection(configuration);
        peerConnection.current = pc;

        // Get user media stream first
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        // Important: Add tracks BEFORE creating offer/answer
        stream.getTracks().forEach(track => {
            track.enabled = !isCameraOn;
            const sender = peerConnection.current.addTrack(track, stream);
            console.log('Added track to peer connection:', track.kind, sender);
        });

        setUserStream(stream);

        // Set up remote stream handling
        const _remoteStream = new MediaStream();
        // setRemoteStream(_remoteStream);
        peerConnection.current.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            _remoteStream.addTrack(event.track);
            setRemoteStream(_remoteStream);
            setConnected(true);
        };


        peerConnection.current.onicecandidate = (event) => {
            console.log('onicecandidate event:', event);
            if (event.candidate) {
                sendDataToMeetingRoom(meetingId, 'video', {
                    type: 'candidate',
                    candidate: event.candidate.toJSON(),
                    clientId: RTCClientId,
                });
            }
        };

        // TODO: handle if drop
        peerConnection.current.oniceconnectionstatechange = () => {
            console.log(`ICE connection state: ${peerConnection.current?.iceConnectionState}`);
        };


    };

    // useEffect(() => {
    //     if (peerConnection.current && remoteStream) {
    //         peerConnection.current.ontrack = (event) => {
    //             console.log('ontrack event:', event);
    //             event.streams[0].getTracks().forEach(track => {
    //                 remoteStream.addTrack(track);
    //             });
    //         };
    //     }
    // }, [remoteStream]);



    // const initializeFirebase = async () => {
    //     const existingMessages = await getAllMessages(meetingId);
    //     setDataStreamingMessages(existingMessages);
    //     const unsub = listenForNewMessages(meetingId, async (message) => {
    //         if (message) {
    //             const lastMessage = message[message.length - 1];
    //             // switch case for different services
    //             if (lastMessage.service === 'code') {
    //                 // TODO: handle new data from remote code editor
    //             } else if (lastMessage.service == 'chat') {
    //                 console.log(lastMessage);
    //                 if (chatRef.current) {
    //                     chatRef.current.loadMessages(message);
    //                 }
    //             } else if (lastMessage.service === 'whiteboard') {
    //                 // TODO: handle new whiteboard data
    //             } else if (lastMessage.service === 'screenshare') {
    //                 // TODO: handle new screenshare data
    //             }
    //             if (lastMessage.service === 'video') {
    //                 if (lastMessage.data.type === 'candidate') {
    //                     await peerConnection.current.addIceCandidate(lastMessage.data.candidate);
    //                 } else if (lastMessage.data.type === 'offer') {
    //                     if (lastMessage.data.clientId !== RTCClientId) {
    //                         console.log('received offer');
    //                         if (peerConnection.current.signalingState === "stable") {
    //                             await peerConnection.current.setRemoteDescription(lastMessage.data.offer);
    //                             const answer = await peerConnection.current.createAnswer();
    //                             await peerConnection.current.setLocalDescription(answer);
    //                             sendDataToMeetingRoom(meetingId, 'video', {
    //                                 type: 'answer',
    //                                 answer: answer,
    //                                 clientId: RTCClientId,
    //                             });
    //                         } else {
    //                             console.error("Unexpected signaling state:", peerConnection.current.signalingState);
    //                         }

    //                         // also send audio and video visibility
    //                         sendDataToMeetingRoom(meetingId, 'video', {
    //                             type: 'video-visibility',
    //                             newVisibility: !isCameraOn,
    //                             clientId: RTCClientId,
    //                         });

    //                         sendDataToMeetingRoom(meetingId, 'video', {
    //                             type: 'audio-visibility',
    //                             newVisibility: !isAudioOn,
    //                             clientId: RTCClientId,
    //                         });

    //                     }
    //                 } else if (lastMessage.data.type === 'answer' && peerConnection.current.signalingState !== "stable") {
    //                     console.log('received answer');
    //                     await peerConnection.current.setRemoteDescription(lastMessage.data.answer);
    //                     console.log('set remote description');
    //                 } else if (lastMessage.data.type === 'video-visibility' && lastMessage.data.clientId !== RTCClientId) {
    //                     console.log('received video visibility change');
    //                     if (remoteStream) {
    //                         const videoTracks = remoteStream.getVideoTracks();
    //                         videoTracks.forEach(track => {
    //                             track.enabled = message.data.newVisibility;
    //                             console.log(`Remote track ${track.label} enabled: ${track.enabled}`);
    //                         });
    //                     }
    //                     setIsOtherCameraOn(lastMessage.data.newVisibility);
    //                 } else if (lastMessage.data.type === 'audio-visibility' && lastMessage.data.clientId !== RTCClientId) {
    //                     console.log('received audio visibility change');
    //                     if (remoteStream) {
    //                         const audioTracks = remoteStream.getAudioTracks();
    //                         audioTracks.forEach(track => {
    //                             track.enabled = message.data.newVisibility;
    //                             console.log(`Remote track ${track.label} enabled: ${track.enabled}`);
    //                         });
    //                     }
    //                     setIsOtherAudioOn(lastMessage.data.newVisibility);
    //                 }
    //             }
    //             setDataStreamingMessages(prevMessages => [...prevMessages, message]);
    //         }
    //     }, true); // true to only get new messages vs getting all messsages
    //     return [unsub, existingMessages];

    // }

    const initializeFirebase = async () => {
        const existingMessages = await getAllMessages(meetingId);
        setDataStreamingMessages(existingMessages);
        
        const handleMessage = async (message) => {
            if (!message) return;
    
            if (message.service === 'code') {
                // TODO: handle new data from remote code editor
            } else if (message.service === 'chat') {
                if (chatRef.current) {
                    const messageData = Array.isArray(message) ? message : [message];
                    chatRef.current.loadMessages(messageData);
                }
            } else if (message.service === 'whiteboard') {
                // TODO: handle new whiteboard data
            } else if (message.service === 'screenshare') {
                // TODO: handle new screenshare data
            } else if (message.service === 'video') {
                if (message.data?.clientId === RTCClientId) return; // Ignore own messages
    
                try {
                    switch (message.data?.type) {
                        case 'candidate':
                            try {
                                if (peerConnection.current?.remoteDescription) {
                                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.data.candidate));
                                } else if (candidateQueue.current) {
                                    candidateQueue.current.push(message.data.candidate);
                                }
                            } catch (e) {
                                console.warn('Error handling ICE candidate:', e);
                            }
                            break;
        
                        case 'offer':
                            console.log('Received offer, state:', peerConnection.current?.signalingState);
                            try {
                                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.data.offer));
                                const answer = await peerConnection.current.createAnswer();
                                await peerConnection.current.setLocalDescription(answer);
                                
                                // Process any queued candidates
                                if (candidateQueue.current?.length > 0) {
                                    for (const candidate of candidateQueue.current) {
                                        try {
                                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                                        } catch (e) {
                                            console.warn('Error adding queued candidate:', e);
                                        }
                                    }
                                    candidateQueue.current = [];
                                }
        
                                sendDataToMeetingRoom(meetingId, 'video', {
                                    type: 'answer',
                                    answer: answer,
                                    clientId: RTCClientId,
                                });
        
                                // Send current video/audio state
                                sendDataToMeetingRoom(meetingId, 'video', {
                                    type: 'video-visibility',
                                    newVisibility: isCameraOn,
                                    clientId: RTCClientId,
                                });
        
                                sendDataToMeetingRoom(meetingId, 'video', {
                                    type: 'audio-visibility',
                                    newVisibility: isAudioOn,
                                    clientId: RTCClientId,
                                });
                            } catch (e) {
                                console.error('Error handling offer:', e);
                            }
                            break;
    
                            case 'answer':
                                console.log('Received answer, state:', peerConnection.current?.signalingState);
                                try {
                                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(message.data.answer));
                                    
                                    // Process any queued candidates
                                    if (candidateQueue.current?.length > 0) {
                                        for (const candidate of candidateQueue.current) {
                                            try {
                                                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                                            } catch (e) {
                                                console.warn('Error adding queued candidate:', e);
                                            }
                                        }
                                        candidateQueue.current = [];
                                    }
                                } catch (e) {
                                    console.error('Error handling answer:', e);
                                }
                                break;
            
                            case 'video-visibility':
                                if (typeof message.data.newVisibility === 'boolean') {
                                    setRemoteVideoEnabled(message.data.newVisibility);
                                }
                                break;
            
                            case 'audio-visibility':
                                if (remoteStream && typeof message.data.newVisibility === 'boolean') {
                                    remoteStream.getAudioTracks().forEach(track => {
                                        track.enabled = message.data.newVisibility;
                                    });
                                    setIsOtherAudioOn(message.data.newVisibility);
                                }
                                break;
                        }
                } catch (error) {
                    console.error('Error handling video message:', error);
                }
            }
    
            setDataStreamingMessages(prevMessages => [...prevMessages, message]);
        };
    
        const unsub = listenForNewMessages(meetingId, async (message) => {
            if (Array.isArray(message)) {
                const lastMessage = message[message.length - 1];
                await handleMessage(lastMessage);
            } else {
                await handleMessage(message);
            }
        }, true);
    
        return [unsub, existingMessages];
    };



    useEffect(() => {
        (async () => {
            // handle meeting that dont exist, as user can still nav directly to this page
            const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting/${meetingId}`);
            if (!response.ok) {
                alert('The meeting you are trying to enter does not exist, or something has gone wrong while joining the meeting');
                navigate('/login');
                return;
            }
            let unsub = null;
            let closePeerConnection = null;
            console.log('initializing...');

            console.log('attempting to be added as participant');

            const [u, messages] = await initializeFirebase();
            unsub = u;
            closePeerConnection = await initializeVideoConnection(messages);
            await sendDataToMeetingRoom(meetingId, 'video', {
                type: 'join',
                clientId: RTCClientId,
            });
            const newMessages = await getAllMessages(meetingId)
            const joinMsgs = newMessages.filter((message) => message.service === 'video' && message.data.type === 'join' && message.data.clientId !== RTCClientId)
            if (joinMsgs.length > 0 && peerConnection.current.signalingState === "stable" && !offerSentRef.current) {
                console.log('sending offer');
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);

                sendDataToMeetingRoom(meetingId, 'video', {
                    type: 'offer',
                    offer: offer,
                    clientId: RTCClientId,
                });
                offerSentRef.current = true;
            }


            return () => {
                if (peerConnection.current) {
                    peerConnection.current.close();
                    peerConnection.current = null;
                }
                if (unsub) {
                    unsub();
                }
                if (userStream) {
                    userStream.getTracks().forEach(track => track.stop());
                }
            };

        })()
    }, []);







    return (
        <>
            {isLoggedIn ? (
                       <div className="flex meeting-container">
                       <div className={`flex flex-col w-full bg-grey-900`}>
                           <div className="flex bg-grey-900">
                               {/* Main content area */}
                               <div className="h-[90vh] w-full relative">
                                {/* Main content area */}
                                <div className="absolute inset-0">
                                    {videoVisible && (
                                        connected ? (
                                            <VideoBox
                                                mediaSource={remoteStream}
                                                displayName="Other Person"
                                                videoOn={remoteVideoEnabled}
                                                audioOn={isOtherAudioOn}
                                                flipHorizontal={true}
                                            />
                                        ) : (
                                            <div className="flex flex-col justify-center items-center h-full w-full text-white">
                                                <p>No one is connected.</p>
                                                <p>Invite others using this link:</p>
                                                <p>
                                                    <a href={`http://localhost:3000/meetings/${meetingId}`} className="text-blue-500 underline">
                                                        http://localhost:3000/meetings/{meetingId}
                                                    </a>
                                                </p>
                                            </div>
                                        )
                                    )}
                                    {editorVisible && (
                                        <div className="absolute inset-0">
                                            <CodeEditor />
                                        </div>
                                    )}
                                    {whiteboardVisible && (
                                        <div className="absolute inset-0">
                                            <Whiteboard roomId={meetingId} />
                                        </div>
                                    )}
                                </div>

                                {/* PiP video box */}
                                <div className="absolute top-4 right-4 w-64 h-48">
                                    <VideoBox
                                        mediaSource={userStream}
                                        displayName="You"
                                        videoOn={isCameraOn}
                                        audioOn={false}
                                        flipHorizontal={true}
                                        collapsible={true}
                                    />
                                </div>

                                {/* Remote video */}
                                {!videoVisible && connected && (
                                    <div className="absolute top-4 left-4 w-64 h-48">
                                        <VideoBox
                                            mediaSource={remoteStream}
                                            displayName="Other Person"
                                            videoOn={remoteVideoEnabled}
                                            audioOn={isOtherAudioOn}
                                            flipHorizontal={true}
                                            collapsible={true}
                                        />
                                    </div>
                                )}
                            </div>
                           </div>
           
                           {/* Navigation bar */}
                           <div className="bg-gray-700 rounded-xl px-4 flex self-end justify-between items-center w-full shadow-md">
                               <div className="flex">
                                   <NavBarButton
                                       icon={!isAudioOn ? FaMicrophoneSlash : FaMicrophone}
                                       text={"Audio"}
                                       onClick={toggleAudio}
                                   />
                                   <NavBarButton
                                       icon={!isCameraOn ? FaVideoSlash : FaVideo}
                                       text={"Video"}
                                       onClick={toggleVideo}
                                   />
                               </div>
                               <div className="flex">
                                   <NavBarButton icon={FaCommentDots} text="Chat" onClick={toggleChat} />
                                   <NavBarButton icon={FaUser} text="Meeting" onClick={toggleMeeting} />
                                   <NavBarButton icon={FaPen} text="Whiteboard" onClick={toggleWhiteboard} />
                                   <NavBarButton icon={FaCode} text="Code" onClick={toggleEditor} />
                                   <NavBarButton icon={MdScreenShare} text="Screenshare" onClick={toggleScreenshare} />
                               </div>
                               <div className="flex">
                                   <NavBarButton icon={FaDoorOpen} text="Leave" onClick={handleLeave} color={'red-500'} />
                               </div>
           
                           </div>
                       </div>
           
                       {/* Chat sidebar */}
                       <div className={`transition-all duration-300 ${chatVisible ? 'w-3/10' : 'w-0'} h-full bg-gray-900 overflow-y-auto`}>
                           {chatVisible && <Chat meetingId={meetingId} ref={chatRef} />}
                       </div>
                   </div>

            ) : (
                <Navigate to="/login"/>
            )}
        </>
    );
}

const NavBarButton = ({ icon: Icon, text, onClick, color }) => {
    return (
        <div className="flex flex-col text-white mx-2">
            <button
                className="bg-gray-700 hover:bg-gray-600 rounded-3xl px-3 py-2 mb-1 active:bg-gray-500 focus:outline-none"
                onClick={onClick}>
                <div className={`flex flex-col align-center items-center`}>
                    <Icon className={`text-xl my-2 text-${color}`} />
                    <span className={`text-xs text-${color}`}>{text}</span>
                </div>
            </button>
        </div>
    );
};

export default MeetingPage;
