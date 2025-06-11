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
import { User } from "types/User";
import { Icon } from "./Icon";

export const DeleteUsersIcon = chakra(TrashIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export type DeleteUsersModalProps = {
  users: User[];
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteUsersModal: FC<DeleteUsersModalProps> = ({
  users,
  isOpen,
  onClose,
}) => {
  const { deleteUsers, onBulkDeleteMode } = useDashboard();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const toast = useToast();

  const handleClose = () => {
    onClose();
  };

  const onDelete = () => {
    setLoading(true);
    deleteUsers(users)
      .then(() => {
        toast({
          title: t("deleteSelectedUsers.success", { count: users.length }),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .finally(() => {
        setLoading(false);
        onBulkDeleteMode(false);
        handleClose();
      });
  };

  return (
    <Modal isCentered isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent mx="3">
        <ModalHeader pt={6}>
          <Icon color="red">
            <DeleteUsersIcon />
          </Icon>
        </ModalHeader>
        <ModalCloseButton mt={3} />
        <ModalBody>
          <Text fontWeight="semibold" fontSize="lg">
            {t("deleteSelectedUsers.title")}
          </Text>
          <Text mt={1} fontSize="sm" _dark={{ color: "gray.400" }} color="gray.600">
            {t("deleteSelectedUsers.prompt")}
          </Text>
        </ModalBody>
        <ModalFooter display="flex">
          <Button size="sm" onClick={handleClose} mr={3} w="full" variant="outline">
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
