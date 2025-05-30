import type { iconProps } from './iconProps';

function anchor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px anchor';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.878,10.121l-1-1.531c-.182-.278-.524-.403-.842-.309-.318,.095-.536,.387-.536,.719,0,2.778-2.072,5.075-4.75,5.443V5.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V14.443c-2.678-.368-4.75-2.665-4.75-5.443,0-.332-.218-.624-.536-.719-.318-.095-.661,.031-.842,.309l-1,1.531c-.227,.347-.129,.812,.218,1.038,.312,.204,.719,.146,.963-.121,.804,2.636,3.131,4.596,5.947,4.899v.312c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.312c2.816-.304,5.144-2.263,5.947-4.899,.244,.266,.651,.325,.963,.121,.347-.227,.444-.691,.218-1.038Z"
          fill="currentColor"
        />
        <path
          d="M9,6c-1.378,0-2.5-1.122-2.5-2.5s1.122-2.5,2.5-2.5,2.5,1.122,2.5,2.5-1.122,2.5-2.5,2.5Zm0-3.5c-.551,0-1,.449-1,1s.449,1,1,1,1-.449,1-1-.449-1-1-1Z"
          fill="currentColor"
        />
        <path
          d="M10.75,9h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default anchor;
