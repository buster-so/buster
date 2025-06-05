import type { iconProps } from './iconProps';

function baloonsHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baloons heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.587,17.245c-.475-.475-.475-1.245,0-1.72l.413-.418c.475-.475,.475-1.245,0-1.72h0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.714,13.181c.18,.092,.391,.092,.572,0,.953-.488,3.964-2.256,3.964-5.132,.005-1.263-1.035-2.291-2.323-2.299-.775,.01-1.496,.393-1.927,1.025-.431-.632-1.151-1.015-1.927-1.025-1.289,.008-2.328,1.036-2.323,2.299,0,2.876,3.011,4.644,3.964,5.132Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.473,16.241c-.487-.487-.487-1.278,0-1.765l.424-.429c.487-.487,.476-1.278-.011-1.766l-.632-.533c-1.586-1.207-4.504-3.572-4.504-6.78-.007-1.768,1.46-3.208,3.28-3.219,1.095,.014,2.112,.55,2.72,1.435,.608-.885,1.626-1.421,2.72-1.435,1.197,.007,2.232,.639,2.805,1.571"
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

export default baloonsHeart;
