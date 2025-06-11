import {
  Button,
  chakra,
  Input,
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
import subDays from "date-fns/subDays";

export const DeleteExpiredIcon = chakra(TrashIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export const DeleteExpiredUsersModal: FC = () => {
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState("");
  const {
    isDeletingExpiredUsers,
    onDeletingExpiredUsers,
    deleteExpiredUsers,
  } = useDashboard();
  const { t } = useTranslation();
  const toast = useToast();

  const onClose = () => {
    setDays("");
    onDeletingExpiredUsers(false);
  };

  const onDelete = () => {
    const d = parseInt(days, 10);
    if (isNaN(d) || d <= 0) {
      toast({
        title: t("deleteExpiredUsers.error"),
        status: "error",
        isClosable: true,
        position: "top",
        duration: 3000,
      });
      return;
    }
    setLoading(true);
    const expired_before = subDays(new Date(), d).toISOString();
    const expired_after = "2000-01-01T00:00:00";
    deleteExpiredUsers(expired_after, expired_before)
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
      .finally(() => {
        setLoading(false);
        onClose();
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
            mt={4}
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder={t("deleteExpiredUsers.prompt") || undefined}
          />
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
