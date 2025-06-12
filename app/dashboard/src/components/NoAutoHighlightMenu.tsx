import { Menu, MenuProps, useMenuContext } from "@chakra-ui/react";
import { FC, useEffect } from "react";

const RemoveInitialHighlight: FC = () => {
  const api = useMenuContext();
  useEffect(() => {
    if (api.open) {
      requestAnimationFrame(() => api.setHighlightedValue(""));
    }
  }, [api.open]);
  return null;
};

export const NoAutoHighlightMenu: FC<MenuProps> = ({ children, ...props }) => (
  <Menu {...props}>
    <RemoveInitialHighlight />
    {children}
  </Menu>
);
