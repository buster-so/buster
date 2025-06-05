import type { iconProps } from './iconProps';

function paperclip2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px paperclip 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m5.196,11.999c-1.187,0-2.373-.451-3.276-1.354C.113,8.838.113,5.898,1.919,4.092L5.032.979c1.261-1.262,3.461-1.262,4.722,0,1.302,1.302,1.302,3.42,0,4.722l-3.112,3.112c-.771.772-2.119.772-2.891,0-.797-.797-.797-2.094,0-2.891l2.746-2.746c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.746,2.746c-.212.212-.212.558,0,.77.205.205.563.206.77,0l3.113-3.112c.717-.717.717-1.884,0-2.601-.694-.694-1.906-.694-2.601,0l-3.112,3.112c-1.222,1.222-1.222,3.21,0,4.432,1.222,1.221,3.21,1.221,4.432,0l2.746-2.746c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.746,2.746c-.903.903-2.09,1.354-3.276,1.354Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default paperclip2;
