import type { iconProps } from './iconProps';

function databaseCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px database check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.346,15.247l-.346,.003c-3.573,0-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079,3.479,0,7-1.03,7-3V4.25c0-1.97-3.521-3-7-3S2,2.28,2,4.25V13.75c0,1.97,3.521,3,7,3l.37-.003c.415-.007,.745-.348,.738-.762s-.342-.711-.762-.738Zm-.346-4.747c-3.573,0-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079s4.151-.368,5.5-1.079v2.829c0,.436-1.927,1.5-5.5,1.5Z"
          fill="currentColor"
        />
        <path
          d="M16.151,11.798l-2.896,3.836-1-.932c-.303-.282-.776-.266-1.06,.037-.283,.303-.266,.777,.037,1.06l1.609,1.5c.139,.13,.322,.202,.511,.202,.021,0,.043,0,.065-.003,.212-.019,.406-.125,.534-.295l3.397-4.5c.25-.331,.184-.801-.146-1.051-.331-.249-.801-.183-1.051,.146Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default databaseCheck;
