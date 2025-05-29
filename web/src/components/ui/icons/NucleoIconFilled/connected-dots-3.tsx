import type { iconProps } from './iconProps';

function connectedDots3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connected dots 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.966,8.658c-.263,0-.519-.139-.656-.386-.201-.362-.07-.819,.292-1.02l5.069-2.816c.359-.201,.818-.071,1.02,.292,.201,.362,.07,.819-.292,1.02l-5.069,2.816c-.115,.064-.24,.094-.364,.094Z"
          fill="currentColor"
        />
        <path
          d="M11.034,13.658c-.124,0-.249-.03-.364-.094l-5.069-2.816c-.362-.201-.493-.658-.292-1.02s.659-.493,1.02-.292l5.069,2.816c.362,.201,.493,.658,.292,1.02-.137,.247-.393,.386-.656,.386Z"
          fill="currentColor"
        />
        <circle cx="4" cy="9" fill="currentColor" r="3" />
        <circle cx="13" cy="4" fill="currentColor" r="3" />
        <circle cx="13" cy="14" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default connectedDots3;
