import type { iconProps } from './iconProps';

function pencil2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pencil 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.387,10.604L9.637,1.354c-.273-.44-1-.44-1.273,0L2.613,10.604c-.074,.119-.113,.256-.113,.396v5.25c0,.414,.336,.75,.75,.75H14.75c.414,0,.75-.336,.75-.75v-5.25c0-.14-.039-.277-.113-.396Zm-3.637,1.007c-.641-.822-1.629-1.361-2.75-1.361s-2.109,.539-2.75,1.361c-.441-.566-1.048-.987-1.752-1.199l2.432-3.913h4.14l2.432,3.913c-.704,.211-1.311,.633-1.752,1.199Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pencil2;
