import type { iconProps } from './iconProps';

function editEasing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px edit easing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11,5.5h.215c.26,.445,.733,.75,1.285,.75,.828,0,1.5-.672,1.5-1.5s-.672-1.5-1.5-1.5c-.552,0-1.025,.305-1.285,.75H5v1.5h.75c1.59,0,2.005,1.169,2.516,3.651,.232,1.125,.496,2.391,1.116,3.349h-2.596c-.26-.445-.733-.75-1.285-.75-.828,0-1.5,.672-1.5,1.5s.672,1.5,1.5,1.5c.552,0,1.025-.305,1.285-.75h6.215v-1.5h-.75c-1.59,0-2.005-1.169-2.516-3.651-.232-1.125-.496-2.391-1.116-3.349h2.381Z"
          fill="currentColor"
        />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1" y="2.5" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="12.5" y="11" />
      </g>
    </svg>
  );
}

export default editEasing;
