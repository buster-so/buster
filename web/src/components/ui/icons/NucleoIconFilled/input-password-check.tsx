import type { iconProps } from './iconProps';

function inputPasswordCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <circle cx="12.5" cy="9" fill="currentColor" r="1" />
        <path
          d="M9.802,12.5H3.75c-.689,0-1.25-.561-1.25-1.25V6.75c0-.689,.561-1.25,1.25-1.25H14.25c.689,0,1.25,.561,1.25,1.25v1.721c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.721c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75h6.052c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.702,10.151c-.333-.25-.802-.184-1.051,.146l-2.896,3.836-1-.933c-.303-.282-.777-.267-1.061,.038-.282,.303-.266,.777,.037,1.06l1.609,1.5c.14,.13,.322,.201,.512,.201,.021,0,.043,0,.065-.003,.211-.019,.405-.125,.533-.295l3.397-4.5c.249-.331,.184-.801-.146-1.051Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default inputPasswordCheck;
