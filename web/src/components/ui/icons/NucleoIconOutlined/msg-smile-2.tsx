import type { iconProps } from './iconProps';

function msgSmile2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg smile 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,1.75C4.996,1.75,1.75,4.996,1.75,9c0,1.319,.358,2.552,.973,3.617,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.433,.082,.881,.125,1.338,.125,4.004,0,7.25-3.246,7.25-7.25S13.004,1.75,9,1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.871,10.905c-.099-.099-.236-.143-.376-.122h0c-.989,.154-2.01,.154-2.995,0-.138-.021-.272,.023-.369,.119-.099,.099-.147,.243-.125,.386,.149,.976,1.006,1.712,1.995,1.712s1.847-.737,1.995-1.714c.021-.139-.025-.282-.124-.38h0Z"
          fill="currentColor"
        />
        <circle cx="6" cy="9" fill="currentColor" r="1" />
        <circle cx="12" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default msgSmile2;
