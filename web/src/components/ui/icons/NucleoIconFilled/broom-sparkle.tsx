import type { iconProps } from './iconProps';

function broomSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px broom sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.376,8.124c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.72,.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-5.874,5.874c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M8.542,8.982c1.044,1.094,2.279,2.007,3.62,2.722,.165-.489,.272-.999,.284-1.522,.029-1.295-.5-2.43-1.575-3.373-1.252-1.098-2.941-1.32-4.449-.743,.589,1.057,1.293,2.049,2.12,2.916Z"
          fill="currentColor"
        />
        <path
          d="M7.458,10.018c-.923-.967-1.693-2.045-2.336-3.2-.155,.124-.314,.242-.458,.388-1.264,1.28-1.92,1.902-3.015,2.051-.4,.055-.685,.417-.645,.818,.337,3.348,2.292,5.847,5.23,6.683,.244,.07,.495,.104,.744,.104,.624,0,1.241-.212,1.744-.614,.399-.319,1.838-1.538,2.807-3.181-1.509-.796-2.898-1.82-4.071-3.05Z"
          fill="currentColor"
        />
        <path
          d="M17.658,11.99l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <path
          d="M5.493,3.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z"
          fill="currentColor"
        />
        <circle cx="8.25" cy="2.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default broomSparkle;
