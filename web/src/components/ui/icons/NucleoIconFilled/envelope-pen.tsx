import type { iconProps } from './iconProps';

function envelopePen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.154,10.14c.265,.146,.555,.22,.846,.22s.581-.073,.845-.219l5.655-3.12v1.253c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.024c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h5.219c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25V7.021l5.654,3.119Z"
          fill="currentColor"
        />
        <path
          d="M14.787,10.756l-3.304,3.304c-.16,.161-.283,.358-.356,.57l-.849,2.457c-.062,.181-.016,.382,.119,.517,.095,.095,.223,.146,.354,.146,.055,0,.11-.009,.164-.027l2.457-.849c.212-.073,.41-.196,.571-.357l3.303-3.303c.674-.674,.672-1.774-.005-2.452-.678-.677-1.777-.68-2.452-.005Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopePen;
