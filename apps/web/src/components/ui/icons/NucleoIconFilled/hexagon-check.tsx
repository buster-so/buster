import type { iconProps } from './iconProps';

function hexagonCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hexagon check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.63,4.148L10.38,1.683c-.852-.493-1.908-.493-2.76,0L3.369,4.148c-.845,.491-1.369,1.402-1.369,2.378v4.946c0,.977,.524,1.888,1.37,2.379l4.25,2.465c.426,.247,.902,.37,1.38,.37s.954-.123,1.38-.37l4.251-2.465c.845-.491,1.369-1.402,1.369-2.378V6.527c0-.977-.524-1.888-1.37-2.379Zm-1.786,2.561l-4.25,5.5c-.137,.176-.344,.283-.565,.291-.01,0-.019,0-.028,0-.212,0-.415-.09-.558-.248l-2.25-2.5c-.277-.308-.252-.782,.056-1.06s.78-.253,1.06,.056l1.648,1.832,3.7-4.789c.254-.328,.725-.388,1.053-.135,.327,.253,.388,.724,.135,1.052Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hexagonCheck;
