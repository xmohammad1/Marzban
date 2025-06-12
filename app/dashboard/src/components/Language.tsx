import {
  chakra,
  IconButton,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
} from "@chakra-ui/react";
import { NoAutoHighlightMenu } from "./NoAutoHighlightMenu";
import { LanguageIcon } from "@heroicons/react/24/outline";
import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";

type HeaderProps = {
  actions?: ReactNode;
};

const LangIcon = chakra(LanguageIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export const Language: FC<HeaderProps> = ({ actions }) => {
  const { i18n } = useTranslation();

  var changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <NoAutoHighlightMenu placement="bottom-end">
      <MenuButton
        as={IconButton}
        size="sm"
        variant="outline"
        icon={<LangIcon />}
        position="relative"
      />
      <MenuList minW="100px" zIndex={9999}>
        <MenuOptionGroup
          type="radio"
          value={i18n.language}
          onChange={(value) => changeLanguage(value as string)}
        >
          <MenuItemOption maxW="100px" fontSize="sm" value="en">
            English
          </MenuItemOption>
          <MenuItemOption maxW="100px" fontSize="sm" value="fa">
            فارسی
          </MenuItemOption>
          <MenuItemOption maxW="100px" fontSize="sm" value="zh-cn">
            简体中文
          </MenuItemOption>
          <MenuItemOption maxW="100px" fontSize="sm" value="ru">
            Русский
          </MenuItemOption>
        </MenuOptionGroup>
      </MenuList>
    </NoAutoHighlightMenu>
  );
};
