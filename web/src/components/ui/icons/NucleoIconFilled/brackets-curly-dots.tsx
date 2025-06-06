import type { iconProps } from './iconProps';

function bracketsCurlyDots(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brackets curly dots';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="12.25" fill="currentColor" r=".75" />
        <circle cx="11.75" cy="12.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="12.25" fill="currentColor" r=".75" />
        <path
          d="M6.25,2h-1c-1.517,0-2.75,1.233-2.75,2.75v2.625c0,.482-.393,.875-.875,.875-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c.482,0,.875,.393,.875,.875v2.625c0,1.517,1.233,2.75,2.75,2.75h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1c-.689,0-1.25-.561-1.25-1.25v-2.625c0-.628-.245-1.2-.645-1.625,.399-.425,.645-.997,.645-1.625v-2.625c0-.689,.561-1.25,1.25-1.25h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.375,8.25c-.482,0-.875-.393-.875-.875v-2.625c0-1.517-1.233-2.75-2.75-2.75h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1c.689,0,1.25,.561,1.25,1.25v2.625c0,.628,.245,1.2,.645,1.625-.399,.425-.645,.997-.645,1.625v2.625c0,.689-.561,1.25-1.25,1.25h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1c1.517,0,2.75-1.233,2.75-2.75v-2.625c0-.482,.393-.875,.875-.875,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bracketsCurlyDots;
