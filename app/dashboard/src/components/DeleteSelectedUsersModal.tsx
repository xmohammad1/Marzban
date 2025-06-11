import {
  Button,
  chakra,
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
} from "@chakra-ui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useDashboard } from "contexts/DashboardContext";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

export const DeleteSelectedIcon = chakra(TrashIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export const DeleteSelectedUsersModal: FC = () => {
  const [loading, setLoading] = useState(false);
  const {
    selectedUsers,
    isDeletingSelectedUsers,
    onDeletingSelectedUsers,
    deleteSelectedUsers,
  } = useDashboard();
  const { t } = useTranslation();
  const toast = useToast();
  const onClose = () => onDeletingSelectedUsers(false);
  const onDelete = () => {
    setLoading(true);
    deleteSelectedUsers()
      .then(() => {
        toast({
          title: t("deleteSelectedUsers.success", { count: selectedUsers.length }),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .then(onClose)
      .finally(() => setLoading(false));
  };
  return (
    <Modal isCentered isOpen={isDeletingSelectedUsers} onClose={onClose} size="sm">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent mx="3">
        <ModalHeader pt={6}>
          <Icon color="red">
            <DeleteSelectedIcon />
          </Icon>
        </ModalHeader>
        <ModalCloseButton mt={3} />
        <ModalBody>
          <Text fontWeight="semibold" fontSize="lg">
            {t("deleteSelectedUsers.title")}
          </Text>
          <Text mt={1} fontSize="sm" _dark={{ color: "gray.400" }} color="gray.600">
            {t("deleteSelectedUsers.prompt", { count: selectedUsers.length })}
          </Text>
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

