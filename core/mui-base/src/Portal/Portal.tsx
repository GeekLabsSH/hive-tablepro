import {
  exactProp,
  unstable_setRef as setRef,
  unstable_useEnhancedEffect as useEnhancedEffect,
  unstable_useForkRef as useForkRef,
} from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { PortalProps } from "./Portal.types";

function getContainer(container: PortalProps["container"]) {
  return typeof container === "function" ? container() : container;
}

/**
 * Portals provide a first-class way to render children into a DOM node
 * that exists outside the DOM hierarchy of the parent component.
 *
 * Demos:
 *
 * - [Portal](https://mui.com/base/react-portal/)
 *
 * API:
 *
 * - [Portal API](https://mui.com/base/api/portal/)
 */
const Portal = React.forwardRef(function Portal(props: any, ref: any) {
  const { children, container, disablePortal = false } = props;
  const [mountNode, setMountNode] =
    React.useState<ReturnType<typeof getContainer>>(null);
  const handleRef = useForkRef(
    React.isValidElement(children as any) ? children.ref : null,
    ref
  );

  useEnhancedEffect(() => {
    if (!disablePortal) {
      setMountNode(getContainer(container) || document.body);
    }
  }, [container, disablePortal]);

  useEnhancedEffect(() => {
    if (mountNode && !disablePortal) {
      setRef(ref, mountNode);
      return () => {
        setRef(ref, null);
      };
    }

    return undefined;
  }, [ref, mountNode, disablePortal]);

  if (disablePortal) {
    if (React.isValidElement(children)) {
      const newProps = {
        ref: handleRef,
      };
      return React.cloneElement(children, newProps);
    }
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <React.Fragment>
      {mountNode ? ReactDOM.createPortal(children, mountNode) : mountNode}
    </React.Fragment>
  );
});

if (process.env.NODE_ENV !== null) {
  // eslint-disable-next-line
  (Portal as any)["propTypes" + ""] = exactProp((Portal as any).propTypes);
}

export default Portal;
