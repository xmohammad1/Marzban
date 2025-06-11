import {
  Button,
  chakra,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useToast,
  Input,
} from "@chakra-ui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useDashboard } from "contexts/DashboardContext";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

export const DeleteExpiredIcon = chakra(TrashIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export const DeleteExpiredUsersModal: FC = () => {
  const [days, setDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isDeletingExpiredUsers, onDeletingExpiredUsers, deleteExpiredUsers } =
    useDashboard();
  const { t } = useTranslation();
  const toast = useToast();

  const onClose = () => {
    setDays(0);
    onDeletingExpiredUsers(false);
  };

  const onDelete = () => {
    setLoading(true);
    deleteExpiredUsers(days)
      .then((removed) => {
        toast({
          title: t("deleteExpiredUsers.success", { count: removed.length }),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .catch(() => {
        toast({
          title: t("deleteExpiredUsers.error"),
          status: "error",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal isCentered isOpen={isDeletingExpiredUsers} onClose={onClose} size="sm">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent mx="3">
        <ModalHeader pt={6}>
          <Icon color="red">
            <DeleteExpiredIcon />
          </Icon>
        </ModalHeader>
        <ModalCloseButton mt={3} />
        <ModalBody>
          <Text fontWeight="semibold" fontSize="lg">
            {t("deleteExpiredUsers.title")}
          </Text>
          <Text mt={1} fontSize="sm" _dark={{ color: "gray.400" }} color="gray.600">
            {t("deleteExpiredUsers.prompt")}
          </Text>
          <FormControl mt={3}>
            <FormLabel>{t("userDialog.days")}</FormLabel>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter display="flex">
          <Button size="sm" onClick={onClose} mr={3} w="full" variant="outline">
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            w="full"
            colorScheme="red"
            onClick={onDelete}
            leftIcon={loading ? <Spinner size="xs" /> : undefined}
          >
            {t("delete")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
