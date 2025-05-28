import type React from 'react';

export const DataBricks: React.FC<{
  onClick?: () => void;
  style?: React.CSSProperties;
  size?: number;
  className?: string;
}> = (props) => {
  return (
    <svg
      {...props}
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_2325_10027)">
        <path
          d="M31.6667 472.8L400 680.1L730.633 495.1V568.767L400 755.4L50.5334 556.733L31.7 567V592.667L400 800L768.333 592.733V448.833L751.167 438.533L400 637.267L71.1 448.833V375.167L400 560.167L768.333 352.9V210.667L751.167 200.4L400 399.133L88.2334 222.7L400 46.2667L658.667 191.867L680.933 178.167V159.3L400 0L31.6667 209V233L400 440.233L730.633 255.233V330.567L400 517.333L50.5334 318.667L31.7 328.933L31.6667 472.8Z"
          fill="#F7341E"
        />
      </g>
      <defs>
        <g>
          <rect width="800" height="800" fill="white" />
        </g>
      </defs>
    </svg>
  );
};
