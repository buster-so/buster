import type { iconProps } from './iconProps';

function envelopeSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.154,10.14c.265,.146,.555,.22,.846,.22s.581-.073,.845-.219l5.655-3.12v2.769c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V5.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h5.07c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25V7.021l5.654,3.119Z"
          fill="currentColor"
        />
        <path
          d="M17.585,13.579l-1.776-.888-.888-1.776c-.254-.508-1.088-.508-1.342,0l-.888,1.776-1.776,.888c-.254,.127-.415,.387-.415,.671s.161,.544,.415,.671l1.776,.888,.888,1.776c.127,.254,.387,.415,.671,.415s.544-.161,.671-.415l.888-1.776,1.776-.888c.254-.127,.415-.387,.415-.671s-.161-.544-.415-.671Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopeSparkle;
