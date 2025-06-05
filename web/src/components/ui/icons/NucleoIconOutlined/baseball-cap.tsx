import type { iconProps } from './iconProps';

function baseballCap(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baseball cap';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,10.75l.187-4.103c.044-.965,.543-1.853,1.354-2.376,1.089-.701,2.776-1.521,4.709-1.521s3.62,.82,4.709,1.521c.812,.523,1.311,1.411,1.354,2.376l.187,4.103"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,2.75c.605,0,1.182,.086,1.728,.219,.009-.073,.022-.144,.022-.219,0-.967-.784-1.75-1.75-1.75s-1.75,.783-1.75,1.75c0,.075,.013,.146,.022,.219,.546-.132,1.123-.219,1.728-.219Z"
          fill="currentColor"
        />
        <path
          d="M9,2.75c-3.083,1.75-2.75,1.854-2.75,7.293"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,2.75c3.083,1.75,2.75,1.854,2.75,7.293"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,10.75c1.517-.433,3.661-.875,6.25-.875s4.733,.442,6.25,.875l.634,2.854c.162,.727-.492,1.368-1.214,1.185-1.52-.385-3.443-.706-5.67-.706-1.418,0-3.385,.131-5.649,.701-.728,.183-1.398-.448-1.236-1.181l.634-2.854Z"
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

export default baseballCap;
