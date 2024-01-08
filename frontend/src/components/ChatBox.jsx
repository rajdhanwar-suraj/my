import React from 'react'
import { Box } from '@chakra-ui/layout'
import SingleChat from './SingleChat'
function ChatBox() {
  return (
    <Box
      d={{"flex" : "none"}}
      alignItems="center"
      flexDir="column"
      p={3}
      bg="white"
      w={{ base: "100%", md: "68%" }}
    >
        <SingleChat />
    </Box>
  )
}

export default ChatBox