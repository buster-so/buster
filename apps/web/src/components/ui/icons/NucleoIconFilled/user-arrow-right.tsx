import type { iconProps } from './iconProps';

function userArrowRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user arrow right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M12,15.25c0-.084,.004-.167,.014-.25h-.264c-1.241,0-2.25-1.009-2.25-2.25s1.009-2.25,2.25-2.25h.264c-.009-.083-.014-.166-.014-.25,0-.181,.028-.357,.069-.529-.939-.461-1.983-.721-3.069-.721-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,1.171,0,2.335-.133,3.479-.378-.305-.393-.479-.866-.479-1.372Z"
          fill="currentColor"
        />
        <path
          d="M17.28,12.22l-2.5-2.5c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.22,1.22h-3.189c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.189l-1.22,1.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userArrowRight;
