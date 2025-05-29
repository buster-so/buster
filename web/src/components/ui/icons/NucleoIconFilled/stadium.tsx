import type { iconProps } from './iconProps';

function stadium(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stadium';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.158,6.184c.357-.16,1.691-.684,3.842-.684s3.484,.524,3.842,.684c.1,.045,.204,.066,.307,.066,.287,0,.56-.165,.685-.443,.17-.378,0-.822-.377-.991-.546-.246-2.075-.816-4.456-.816s-3.91,.57-4.456,.816c-.378,.169-.547,.613-.377,.991,.169,.377,.613,.546,.991,.377Z"
          fill="currentColor"
        />
        <path
          d="M9,1.5C4.439,1.5,1,3.22,1,5.5c-.004,.124,.021,.306,.021,.306l.986,7.295c.234,1.731,2.419,3.009,5.493,3.323v-2.923c0-.276,.224-.5,.5-.5h2c.276,0,.5,.224,.5,.5v2.923c3.075-.314,5.259-1.592,5.493-3.323l.986-7.295s.025-.182,.021-.306c0-2.28-3.439-4-8-4Zm0,6.5c-4.027,0-6.5-1.456-6.5-2.5s2.473-2.5,6.5-2.5,6.5,1.456,6.5,2.5-2.473,2.5-6.5,2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stadium;
