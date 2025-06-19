import type { iconProps } from './iconProps';

function handHoldingCoin2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand holding coin 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="13.75"
          cy="10"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 10.75L13.75 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25,13.4l2.279-4.656c.23-.47,.549-.891,.942-1.237,.534-.469,1.373-1.185,2.308-1.899,1.151-.879,2.602-1.265,4.161-1.265,.602,0,1.196,.095,1.766,.282,.706,.232,1.089,.989,.86,1.699-.232,.707-.992,1.092-1.699,.859-.58-.19-1.212-.197-1.829-.014-.909,.27-1.649,1.009-1.923,1.917-.608,2.02,.896,3.874,2.825,3.874,.317,0,.628-.049,.927-.147,.707-.232,1.467,.153,1.699,.859,.045,.14,.067,.281,.067,.42,0,.566-.36,1.093-.927,1.279-.57,.187-1.164,.282-1.766,.282l-2.959,.002c-.804,0-1.592,.226-2.274,.651l-1.114,.694"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.365,4.276c.44-.298,.679-.843,.562-1.395-.158-.729-.87-1.191-1.597-1.037-.587,.125-1.148,.341-1.669,.644-1.348,.783-2.07,1.794-2.682,3.158-.482,1.073-1.45,3.099-1.45,3.099"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.349,9.112c.24-3.304,.386-5.605,1.405-6.988s2.075-1.1,2.075-1.1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default handHoldingCoin2;
