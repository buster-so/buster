import React from 'react';

import type { iconProps } from './iconProps';

function gears(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gears';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m13.246,11v-.305c0-.439-.33-.808-.767-.857l-.943-.105-.433-1.046.593-.741c.274-.343.247-.837-.064-1.148l-.433-.433c-.311-.311-.805-.338-1.148-.064l-.741.593-1.047-.433-.105-.943c-.049-.437-.418-.767-.857-.767h-.606c-.439,0-.808.33-.857.767l-.105.943-1.047.433-.741-.593c-.343-.274-.837-.247-1.148.064l-.433.433c-.311.311-.338.805-.064,1.148l.593.741-.433,1.046-.943.105c-.437.049-.767.418-.767.857v.611c0,.439.33.808.767.857l.943.105.433,1.046-.593.741c-.274.343-.247.837.064,1.148l.433.433c.311.311.805.338,1.148.064l.741-.593,1.047.433.105.943c.049.437.418.767.857.767h.606c.439,0,.808-.33.857-.767l.105-.943,1.047-.433.741.593c.343.274.837.247,1.148-.064l.433-.433c.311-.311.338-.805.064-1.148l-.593-.741.433-1.046.943-.105c.437-.049.767-.418.767-.857v-.306Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.618,9.804l.275-.275c.261-.261.284-.676.053-.964l-.498-.622.364-.879.792-.088c.367-.041.644-.351.644-.72h.002v-.514c0-.369-.277-.679-.644-.72l-.792-.088-.364-.879.498-.622c.23-.288.207-.703-.053-.964l-.364-.364c-.261-.261-.676-.284-.964-.053l-.622.498-.879-.364-.088-.792c-.041-.367-.351-.644-.72-.644h-.514c-.369,0-.679.277-.72.644l-.088.792-.879.364-.622-.498c-.288-.23-.703-.207-.964.053l-.276.276"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7"
          cy="11"
          fill="currentColor"
          r="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default gears;
