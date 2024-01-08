import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from '@chakra-ui/icons';
import { Box, Input, Button, Flex, VStack, Text, ChakraProvider, CSSReset, Avatar, Spinner } from '@chakra-ui/react';
import { FaMicrophone } from 'react-icons/fa';
import axios from 'axios';
import io from 'socket.io-client';
import MicRecorder from 'mic-recorder-to-mp3';

const socket = io('http://localhost:5000');
const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const MAX_RECORDING_DURATION = 30 * 1000; // 30 seconds in milliseconds

const ChatGPT = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [recordingTimeout, setRecordingTimeout] = useState(null);

  useEffect(() => {
    socket.on('responseMessage', (response) => {
      console.log('Received response:', response);
      setMessages((prevMessages) => [...prevMessages, { text: response.text, sender: 'server' }]);
      setLoading(false);
    });

    socket.on('userMessage', (userMessage) => {
      console.log('Received user message:', userMessage);
      setMessages((prevMessages) => [...prevMessages, userMessage]);
    });

    return () => {
      socket.off('responseMessage');
      socket.off('userMessage');
    };
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    setMessages((prevMessages) => [...prevMessages, { text: newMessage, sender: 'user' }]);
    setNewMessage('');
    setLoading(true);

    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      };

      const { data } = await axios.post('http://localhost:5000/api/message', { text: newMessage }, config);

      console.log('Message sent successfully typing question:', data);
    } catch (error) {
      console.log('Error sending message:', error);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuestionClick = async (question) => {
    try {
      setMessages((prevMessages) => [...prevMessages, { text: question, sender: 'user' }]);
      setLoading(true);

      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      };

      const { data } = await axios.post('http://localhost:5000/api/message', { text: question }, config);

      console.log('Message sent successfully by click question:', data);

    } catch (error) {
      console.log('Error sending question:', error);
      setLoading(false);
    }
  };

  const handleStartRecording = () => {
    if (!isRecording) {
      Mp3Recorder.start();
      setIsRecording(true);

      // Set a timeout to stop recording after the maximum duration
      const timeout = setTimeout(() => {
        handleStopRecording();
      }, MAX_RECORDING_DURATION);

      setRecordingTimeout(timeout);
    }
  };

  const handleStopRecording = async () => {
    if (isRecording) {
      const [buffer, blob] = await Mp3Recorder.stop().getMp3();
      const audioData = { buffer, blob };

      setIsRecording(false);
      setAudioData(audioData);

      // Handle sending the recorded audio to the backend
      setLoading(true);
      const formData = new FormData();
      formData.append('audio', audioData.blob);
      try {
        const { data } = await axios.post('http://localhost:5000/api/voice', formData);
      
        console.log('Audio message sent successfully:', data);
      } catch (error) {
        // Log the specific error message received from the server
        console.log('Error sending audio message:', error.response ? error.response.data : error.message);
      
        // Set loading state to false to indicate that the operation is complete
        setLoading(false);
      }

      setAudioData(null);
    }

    // Clear any previous recording timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
  };

  const optionalQuestions = [
    "How does ChatGPT work?",
    "What can ChatGPT help me with?",
    "Tell me more about ChatGPT's capabilities.",
    "How can I customize ChatGPT?"
  ];

  return (
    <ChakraProvider>
      <CSSReset />
      <Flex
        direction="column"
        height="100vh"
        width="100%"
        maxW="900px"
        margin="0 auto"
        overflow="hidden"
        pt='12'
      >
        <Box
          flex="1"
          p={4}
          overflowY="auto"
          bg="white"
          borderRadius="md"
          css={{
            scrollbarWidth: 'thin',
            overflow: '-webkit-scrollbar',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'transparent',
            },
          }}
        >
          {messages.length === 0 && (
            <VStack align="center" spacing={5} m={3}>
              <Avatar
                size="xl"
                src="https://freelogopng.com/images/all_img/1681038887chatgpt-logo%20black-and-white.png"
                alt="ChatGPT Logo"
                boxShadow="2xl"
                p='2'
              />
              <Text fontWeight="bold" fontSize="30px" color="black">
                How can I help you today?
              </Text>
            </VStack>
          )}

          {messages.map((message, index) => (
            <VStack
              key={index}
              align={message.sender === 'user' ? 'flex-start' : 'flex-start'}
              spacing={1}
            >
              {message.sender === 'user' && (
                <Text fontWeight="bold" fontSize="20px" color="black">
                  YOU
                </Text>
              )}

              <Box
                bg="transparent"
                borderRadius="md"
                textAlign={message.sender === 'user' ? 'left' : 'left'}
                mb={5}
              >
                {message.sender === 'server' && (
                  <Text fontWeight="bold" fontSize="20px" color="black">
                    BACKEND
                  </Text>
                )}

                <Text fontWeight="bold" color="gray">
                  {message.text}
                </Text>

                {loading && index === messages.length - 1 && (
                  <Flex align="center" justify="left" mt="2">
                    <Spinner size="sm" />
                  </Flex>
                )}
              </Box>
            </VStack>
          ))}
        </Box>

        {messages.length === 0 && (
          <Flex
            direction="row"
            wrap="wrap"
            justify="space-between"
            m={3}>
            {optionalQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="lg"
                width="48%"
                textAlign="start"
                m={1}
                p={10}
                borderRadius='xl'
                onClick={() => handleQuestionClick(question)}
              >
                {question}
              </Button>
            ))}
          </Flex>
        )}

        <Flex
          border="2px solid gray"
          borderRadius="3xl"
          align="center"
          overflow="hidden"
          bg="transparent"
          p={2}
          m={[0, 5]}
        >
          <Input
            type="text"
            placeholder="Type your message..."
            color="black"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            flex="1"
            p={4}
            m={1}
            border="none"
            borderRadius="md"
            focusBorderColor="transparent"
            fontSize="lg"
            _placeholder={{ opacity: 1, color: 'grey' }}
          />
          <Button
            onClick={handleSendMessage}
            p={3}
            mr={3}
            borderRadius="md"
            bg="black"
            color="white"
            _hover={{ bg: 'gray', color: 'black' }}
          >
            <ArrowUpIcon w={5} h={5} />
          </Button>
          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            p={3}
            borderRadius="md"
            bg={isRecording ? 'red' : 'black'}
            color="white"
            _hover={{ bg: 'gray', color: 'black' }}
            disabled={loading} // Disable while loading
          >
            {isRecording ? 'Stop' : <FaMicrophone w={5} h={5} />}
          </Button>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default ChatGPT;
