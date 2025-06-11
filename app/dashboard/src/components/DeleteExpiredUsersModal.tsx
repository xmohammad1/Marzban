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
import { FC, useState } from "react";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { useDashboard } from "contexts/DashboardContext";
import { useTranslation } from "react-i18next";

export const DeleteExpiredIcon = chakra(TrashIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export const DeleteExpiredUsersModal: FC = () => {
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const {
    isDeletingExpiredUsers,
    onDeleteExpiredUsers,
    deleteExpiredUsers,
  } = useDashboard();
  const { t } = useTranslation();
  const toast = useToast();
  const onClose = () => {
    onDeleteExpiredUsers(false);
    setDays("");
    setError(null);
  };
  const onDelete = () => {
    const num = parseInt(days);
    if (isNaN(num) || num <= 0) {
      setError(t("deleteExpiredUsers.invalidDays"));
      return;
    }
    setLoading(true);
    deleteExpiredUsers(num)
      .then((removed) => {
        toast({
          title: t("deleteExpiredUsers.success", { count: removed.length }),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
        onClose();
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
      .finally(() => {
        setLoading(false);
      });
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
          <Input
            type="number"
            mt={4}
            value={days}
            onChange={(e) => {
              setDays(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t("deleteExpiredUsers.days")}
            error={error || undefined}
          />
          <Text mt={1} fontSize="sm" _dark={{ color: "gray.400" }} color="gray.600">
            {t("deleteExpiredUsers.prompt")}
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
