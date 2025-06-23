import type { iconProps } from './iconProps';

function jackOLantern(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px jack o lantern';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11,4.75c-.709,0-1.383,.145-2,.399-.617-.254-1.291-.399-2-.399-2.899,0-5.25,2.351-5.25,5.25s2.351,5.25,5.25,5.25h4c2.899,0,5.25-2.351,5.25-5.25s-2.351-5.25-5.25-5.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75,4.75c.111-1.497,.644-2.726,1.5-3.75l2,.25c-.551,1.287-.896,2.492-.75,3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.306,10h2.34c.183,0,.351-.099,.438-.259,.088-.16,.081-.354-.017-.509l-1.17-1.844c-.184-.289-.66-.289-.844,0l-1.17,1.844c-.098,.154-.104,.349-.017,.509,.088,.16,.256,.259,.438,.259Z"
          fill="currentColor"
        />
        <path
          d="M10.354,10h2.34c.183,0,.351-.099,.438-.259,.088-.16,.081-.354-.017-.509l-1.17-1.844c-.184-.289-.66-.289-.844,0l-1.17,1.844c-.098,.154-.104,.349-.017,.509,.088,.16,.256,.259,.438,.259Z"
          fill="currentColor"
        />
        <path
          d="M13.146,11.285c-.099-.208-.329-.317-.551-.275-.696,.141-1.395,.229-2.095,.288v.703c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.627c-1.201,0-2.402-.121-3.595-.363-.226-.043-.452,.067-.551,.275-.099,.207-.044,.455,.134,.601,1.331,1.096,2.671,1.644,4.012,1.644s2.681-.548,4.012-1.644c.178-.146,.232-.394,.134-.601Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default jackOLantern;
