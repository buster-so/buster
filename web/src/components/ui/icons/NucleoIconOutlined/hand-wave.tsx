import type { iconProps } from './iconProps';

function handWave(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hand wave';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9.1015,6.8586l-3.7123-3.7123c-.4879-.4879-1.2827-.4851-1.7678,0s-.4879,1.2799,0,1.7678l3.7123,3.7123"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.5053,5.798c-.4879-.4879-1.2827-.4851-1.7678,0s-.4879,1.2799,0,1.7678l2.8284,2.8284"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.7975,8.6271c-.4879-.4879-1.2827-.4851-1.7678,0s-.4879,1.2799,0,1.7678l4.2433,4.2433c1.9523,1.9523,5.1187,1.9523,7.0711,0l1.2339-1.2339c1.4354-1.4354,2.0478-3.5002,1.6263-5.4871l-.7453-3.5171c-.1633-.7191-.7085-1.1738-1.3902-1.0918s-1.1745.705-1.0918,1.3902l.3422,2.8426-5.2786-5.2786c-.4879-.4879-1.2827-.4851-1.7678,0s-.4879,1.2799,0,1.7678"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m13.3194,7.541c-1.684.6567-2.4676,1.8203-2.3507,3.4902"
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

export default handWave;
