import type { iconProps } from './iconProps';

function suitcaseMusic(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase music';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.5,15.75c0-1.811,1.291-3.326,3-3.675v-1.325c0-.917,.549-1.735,1.398-2.083,.272-.111,.559-.167,.852-.167,.602,0,1.188,.247,1.608,.676,.195,.199,.42,.367,.642,.538v-2.964c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h5.775c-.006-.084-.025-.164-.025-.25Z"
          fill="currentColor"
        />
        <path
          d="M17.56,11.817c-.397-.18-.78-.396-1.138-.64-.407-.278-.79-.598-1.137-.952-.213-.218-.538-.284-.819-.169-.282,.115-.466,.39-.466,.694v2.888c-.236-.084-.486-.138-.75-.138-1.241,0-2.25,1.009-2.25,2.25s1.009,2.25,2.25,2.25,2.25-1.009,2.25-2.25v-3.387c.025,.018,.051,.035,.077,.053,.429,.293,.887,.551,1.363,.767,.378,.171,.821,.004,.993-.373,.171-.377,.004-.822-.373-.993Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseMusic;
