import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';

// ASCII art for the Buster "b" logo - compact version
const BUSTER_LOGO_FRAMES = [
  // Frame 1 - dimmer
  `
    .:::::.    
  .=++++++=.   
 :+++++++++=:  
.+++=:.:=+++:. 
:+++.   .+++:  
:+++=====:.    
:+++.   .:==:  
:+++:   :+++:  
.+++=:.:=+++=. 
 :+++++++++=:  
  .=++++++=.   
    .:::::.    
  `,
  // Frame 2 - medium brightness
  `
    .=====.    
  .=#####+=.   
 :#########+:  
.###=:.:=###:. 
:###.   .###:  
:###=====:.    
:###.   .:==:  
:###:   :###:  
.###=:.:=###+. 
 :#########+:  
  .=#####+=.   
    .=====.    
  `,
  // Frame 3 - brightest
  `
    .=@@@=.    
  .=@@@@@+=.   
 :@@@@@@@@@+:  
.@@@=:.:=@@@:. 
:@@@.   .@@@:  
:@@@=====:.    
:@@@.   .:==:  
:@@@:   :@@@:  
.@@@=:.:=@@@+. 
 :@@@@@@@@@+:  
  .=@@@@@+=.   
    .=@@@=.    
  `,
];

interface AnimatedLogoProps {
  color?: string;
}

export function AnimatedLogo({ color = '#7C3AED' }: AnimatedLogoProps) {
  const [_frame, setFrame] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [growing, setGrowing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (growing) {
        if (opacity < 2) {
          setOpacity(opacity + 1);
        } else {
          setGrowing(false);
        }
      } else {
        if (opacity > 0) {
          setOpacity(opacity - 1);
        } else {
          setGrowing(true);
        }
      }
      setFrame((prev) => (prev + 1) % 3);
    }, 200);

    return () => clearInterval(interval);
  }, [opacity, growing]);

  // Select the appropriate frame based on opacity
  const currentFrame = BUSTER_LOGO_FRAMES[opacity];

  return (
    <Box flexDirection='column' alignItems='center'>
      <Text color={color}>{currentFrame}</Text>
    </Box>
  );
}
