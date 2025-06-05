import type { iconProps } from './iconProps';

function clipboardCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clipboard check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,2h-.275c-.123-.846-.845-1.5-1.725-1.5h-3.5c-.879,0-1.602,.654-1.725,1.5h-.275c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-5.75,.25c0-.138,.112-.25,.25-.25h3.5c.138,0,.25,.112,.25,.25v1c0,.138-.112,.25-.25,.25h-3.5c-.138,0-.25-.112-.25-.25v-1Zm5.35,5.45l-3.75,5c-.136,.181-.346,.291-.572,.299-.009,0-.019,0-.028,0-.216,0-.422-.093-.564-.256l-1.75-2c-.273-.312-.241-.785,.071-1.058s.785-.242,1.058,.071l1.141,1.303,3.195-4.26c.249-.331,.719-.397,1.05-.15,.331,.249,.398,.719,.15,1.05Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clipboardCheck;
