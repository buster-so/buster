import type { iconProps } from './iconProps';

function magnifierSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magnifier sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,16c-.192,0-.384-.073-.53-.22l-3.965-3.965c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.965,3.965c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M7.75,2c-3.171,0-5.75,2.58-5.75,5.75s2.579,5.75,5.75,5.75,5.75-2.58,5.75-5.75S10.921,2,7.75,2Zm2.158,6.206l-1.263,.421-.421,1.263c-.068,.204-.26,.342-.475,.342s-.406-.138-.475-.342l-.421-1.263-1.263-.421c-.204-.068-.342-.259-.342-.474s.138-.406,.342-.474l1.263-.421,.421-1.263c.137-.408,.812-.408,.949,0l.421,1.263,1.263,.421c.204,.068,.342,.259,.342,.474s-.138,.406-.342,.474Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default magnifierSparkle;
