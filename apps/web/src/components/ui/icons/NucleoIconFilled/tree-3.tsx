import type { iconProps } from './iconProps';

function tree3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tree 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C5.554,1,2.75,3.804,2.75,7.25c0,3.192,2.407,5.828,5.5,6.201v-2.39l-2.03-2.03c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.97,.97v-3.189c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.439l.97-.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.03,2.03v4.14c3.093-.372,5.5-3.009,5.5-6.201,0-3.446-2.804-6.25-6.25-6.25Z"
          fill="currentColor"
        />
        <path
          d="M9,13.5c-.254,0-.504-.02-.75-.049v2.799c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.799c-.246,.03-.496,.049-.75,.049Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tree3;
