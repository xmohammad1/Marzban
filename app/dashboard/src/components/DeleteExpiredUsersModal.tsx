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
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "contexts/DashboardContext";
import { DeleteIcon } from "./DeleteUserModal";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { generateErrorMessage } from "utils/toastHandler";

export const DeleteExpiredUsersModal: FC = () => {
  const {
    isDeletingExpiredUsers,
    onDeleteExpiredUsers,
    deleteExpiredUsers,
  } = useDashboard();
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(0);

  const onClose = () => {
    onDeleteExpiredUsers(false);
    setDays(0);
  };

  const onDelete = () => {
    setLoading(true);
    deleteExpiredUsers(days)
      .then((count) => {
        toast({
          title: t("deleteExpiredUsers.success", { count }),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
        onClose();
      })
      .catch((e) => generateErrorMessage(e, toast))
      .finally(() => setLoading(false));
  };

  return (
    <Modal isCentered isOpen={isDeletingExpiredUsers} onClose={onClose} size="sm">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent mx="3">
        <ModalHeader pt={6}>
          <Icon color="red">
            <DeleteIcon />
          </Icon>
        </ModalHeader>
        <ModalCloseButton mt={3} />
        <ModalBody>
          <Text fontWeight="semibold" fontSize="lg">
            {t("deleteExpiredUsers.title")}
          </Text>
          {isDeletingExpiredUsers && (
            <>
              <Text
                mt={1}
                fontSize="sm"
                _dark={{ color: "gray.400" }}
                color="gray.600"
              >
                {t("deleteExpiredUsers.prompt")}
              </Text>
              <Input
                mt={3}
                type="number"
                value={String(days)}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </>
          )}
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
