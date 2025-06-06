import type { iconProps } from './iconProps';

function vrHeadsetSignal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vr headset signal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.757,3.507c2.343-2.343,6.142-2.343,8.485,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.879,5.629c1.172-1.172,3.071-1.172,4.243,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,8.25c2.004,0,4.499,.072,5.735,1.048,1.236,.975,1.698,1.982,1.45,3.786-.247,1.804-1.368,2.779-2.664,3.071-1.297,.293-2.35-.133-2.892-.706-.585-.617-.894-1.143-1.629-1.143-.735,0-1.044,.526-1.629,1.143-.542,.573-1.596,.999-2.892,.706-1.296-.292-2.417-1.267-2.664-3.071-.247-1.804,.214-2.811,1.45-3.786,1.236-.975,3.732-1.048,5.735-1.048Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default vrHeadsetSignal;
