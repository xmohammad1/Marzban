import {
  Badge,
  Box,
  Button,
  chakra,
  CircularProgress,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useToast,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { joinPaths } from "@remix-run/router";
import classNames from "classnames";
import { useCoreSettings } from "contexts/CoreSettingsContext";
import { useDashboard } from "contexts/DashboardContext";
import debounce from "lodash.debounce";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { ReadyState } from "react-use-websocket";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { getAuthToken } from "utils/authStorage";
import { Icon } from "./Icon";
import { JsonEditor } from "./JsonEditor";
import "./JsonEditor/themes.js";
import { useNodesQuery } from "contexts/NodesContext";

export const MAX_NUMBER_OF_LOGS = 500;

const UsageIcon = chakra(Cog6ToothIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});
export const ReloadIcon = chakra(ArrowPathIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export const FullScreenIcon = chakra(ArrowsPointingOutIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});
export const ExitFullScreenIcon = chakra(ArrowsPointingInIcon, {
  baseStyle: {
    w: 3,
    h: 3,
  },
});

const getStatus = (status: string) => {
  return {
    [ReadyState.CONNECTING]: "connecting",
    [ReadyState.OPEN]: "connected",
    [ReadyState.CLOSING]: "closed",
    [ReadyState.CLOSED]: "closed",
    [ReadyState.UNINSTANTIATED]: "closed",
  }[status];
};

const getWebsocketUrl = (nodeID: string) => {
  try {
    let baseURL = new URL(
      import.meta.env.VITE_BASE_API.startsWith("/")
        ? window.location.origin + import.meta.env.VITE_BASE_API
        : import.meta.env.VITE_BASE_API
    );

    return (
      (baseURL.protocol === "https:" ? "wss://" : "ws://") +
      joinPaths([
        baseURL.host + baseURL.pathname,
        !nodeID ? "/core/logs" : `/node/${nodeID}/logs`,
      ]) +
      "?interval=1&token=" +
      getAuthToken()
    );
  } catch (e) {
    console.error("Unable to generate websocket url");
    console.error(e);
    return null;
  }
};

let logsTmp: string[] = [];
const CoreSettingModalContent: FC = () => {

  const { colorMode } = useColorMode();

  const { data: nodes } = useNodesQuery();
  const disabled = false;
  const [selectedNode, setNode] = useState<string>("");
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [isTemplatePosting, setIsTemplatePosting] = useState(false);

  const handleLog = (id: string, title: string) => {
    if (id === selectedNode) return;
    else if (id === "host") {
      setNode("");
      setLogs([]);
    } else {
      setNode(id);
      setLogs([]);
    }
  };

  const { isEditingCore } = useDashboard();
  const {
    fetchCoreSettings,
    updateConfig,
    isLoading,
    config,
    isPostLoading,
    version,
    restartCore,
    templates,
    fetchTemplates,
    isTemplatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useCoreSettings();
  const logsDiv = useRef<HTMLDivElement | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { t } = useTranslation();
  const toast = useToast();
  const form = useForm({
    defaultValues: { config: config || {} },
  });
  const templateForm = useForm({
    defaultValues: { name: "", config: config || {} },
  });

  useEffect(() => {
    if (config) form.setValue("config", config);
    if (!activeTemplateId) {
      templateForm.setValue("config", config || {});
    }
  }, [config]);

  useEffect(() => {
    if (isEditingCore) {
      fetchCoreSettings();
      fetchTemplates();
    }
  }, [isEditingCore]);
  "".startsWith;
  const scrollShouldStayOnEnd = useRef(true);
  const updateLogs = useCallback(
    debounce((logs: string[]) => {
      const isScrollOnEnd =
        Math.abs(
          (logsDiv.current?.scrollTop || 0) -
            (logsDiv.current?.scrollHeight || 0) +
            (logsDiv.current?.offsetHeight || 0)
        ) < 10;
      if (logsDiv.current && isScrollOnEnd)
        scrollShouldStayOnEnd.current = true;
      else scrollShouldStayOnEnd.current = false;
      if (logs.length < 40) setLogs(logs);
    }, 300),
    []
  );

  const { readyState } = useWebSocket(getWebsocketUrl(selectedNode), {
    onMessage: (e: any) => {
      logsTmp.push(e.data);
      if (logsTmp.length > MAX_NUMBER_OF_LOGS)
        logsTmp = logsTmp.splice(0, logsTmp.length - MAX_NUMBER_OF_LOGS);
      updateLogs([...logsTmp]);
    },
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 1000,
  });

  useEffect(() => {
    if (logsDiv.current && scrollShouldStayOnEnd.current)
      logsDiv.current.scrollTop = logsDiv.current?.scrollHeight;
  }, [logs]);

  useEffect(() => {
    return () => {
      logsTmp = [];
    };
  }, []);

  const status = getStatus(readyState.toString());

  const { mutate: handleRestartCore, isLoading: isRestarting } =
    useMutation(restartCore);

  const handleOnSave = ({ config }: any) => {
    updateConfig(config)
      .then(() => {
        toast({
          title: t("xrayConfig.successMessage"),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .catch((e) => {
        let message = t("xrayConfig.generalErrorMessage");
        if (typeof e.response._data.detail === "object")
          message =
            e.response._data.detail[Object.keys(e.response._data.detail)[0]];
        if (typeof e.response._data.detail === "string")
          message = e.response._data.detail;

        toast({
          title: message,
          status: "error",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      });
  };
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setFullScreen] = useState(false);
  const handleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullScreen(false);
    } else {
      editorRef.current?.requestFullscreen();
      setFullScreen(true);
    }
  };
  const handleSelectTemplate = (id?: number) => {
    const template = templates?.find((t) => t.id === id);
    setActiveTemplateId(template?.id ?? null);
    templateForm.reset({
      name: template?.name || "",
      config: template?.config || config || {},
    });
  };

  const extractErrorMessage = (e: any, fallback: string) => {
    if (typeof e?.response?._data?.detail === "object") {
      return (
        e.response._data.detail[Object.keys(e.response._data.detail)[0]] ||
        fallback
      );
    }
    if (typeof e?.response?._data?.detail === "string") {
      return e.response._data.detail;
    }
    return fallback;
  };

  const handleTemplateSave = templateForm.handleSubmit(({ name, config }) => {
    setIsTemplatePosting(true);
    const action = activeTemplateId
      ? updateTemplate(activeTemplateId, { name, config })
      : createTemplate({ name, config });

    action
      .then((res: any) => {
        toast({
          title: t("xrayConfig.templateSaved"),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
        if (res?.id && !activeTemplateId) {
          setActiveTemplateId(res.id);
        }
      })
      .catch((e: any) => {
        toast({
          title: extractErrorMessage(e, t("xrayConfig.generalErrorMessage")),
          status: "error",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .finally(() => setIsTemplatePosting(false));
  });

  const handleTemplateDelete = (id: number) => {
    if (!window.confirm(t("xrayConfig.deleteConfirm"))) return;
    setIsTemplatePosting(true);
    deleteTemplate(id)
      .then(() => {
        toast({
          title: t("xrayConfig.templateDeleted"),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 2000,
        });
        if (activeTemplateId === id) {
          setActiveTemplateId(null);
          templateForm.reset({ name: "", config: config || {} });
        }
      })
      .catch((e: any) => {
        toast({
          title: extractErrorMessage(e, t("xrayConfig.generalErrorMessage")),
          status: "error",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .finally(() => setIsTemplatePosting(false));
  };

  return (
    <Tabs isLazy colorScheme="primary">
      <TabList px="6">
        <Tab>{t("xrayConfig.defaultTab")}</Tab>
        <Tab>{t("xrayConfig.templatesTab")}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel px="0">
          <form onSubmit={form.handleSubmit(handleOnSave)}>
            <ModalBody>
              <FormControl>
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <FormLabel>
                    {t("xrayConfig.configuration")}{" "}
                    {isLoading && (
                      <CircularProgress isIndeterminate size="15px" />
                    )}
                  </FormLabel>
                  <HStack gap={0}>
                    <Tooltip label="Xray Version" placement="top">
                      <Badge height="100%" textTransform="lowercase">
                        {version && `v${version}`}
                      </Badge>
                    </Tooltip>
                  </HStack>
                </HStack>
                <Box position="relative" ref={editorRef} minHeight="300px">
                  <Controller
                    control={form.control}
                    name="config"
                    render={({ field }) => (
                      <JsonEditor json={config} onChange={field.onChange} />
                    )}
                  />
                  <IconButton
                    size="xs"
                    aria-label="full screen"
                    variant="ghost"
                    position="absolute"
                    top="2"
                    right="4"
                    onClick={handleFullScreen}
                  >
                    {!isFullScreen ? <FullScreenIcon /> : <ExitFullScreenIcon />}
                  </IconButton>
                </Box>
              </FormControl>
              <FormControl mt="4">
                <HStack
                  justifyContent="space-between"
                  style={{ paddingBottom: "1rem" }}
                >
                  <HStack>
                    {nodes?.[0] && (
                      <Select
                        size="sm"
                        style={{ width: "auto" }}
                        disabled={disabled}
                        bg={disabled ? "gray.100" : "transparent"}
                        _dark={{
                          bg: disabled ? "gray.600" : "transparent",
                        }}
                        sx={{
                          option: {
                            backgroundColor:
                              colorMode === "dark" ? "#222C3B" : "white",
                          },
                        }}
                        onChange={(v) =>
                          handleLog(
                            v.currentTarget.value,
                            v.currentTarget.selectedOptions[0].text
                          )
                        }
                      >
                        <option key={"host"} value={"host"} defaultChecked>
                          Master
                        </option>
                        {nodes &&
                          nodes.map((s) => {
                            return (
                              <option key={s.address} value={String(s.id)}>
                                {t(s.name)}
                              </option>
                            );
                          })}
                      </Select>
                    )}
                    <FormLabel className="w-au">
                      {t("xrayConfig.logs")}
                    </FormLabel>
                  </HStack>
                  <Text as={FormLabel}>{t(`xrayConfig.socket.${status}`)}</Text>
                </HStack>
                <Box
                  border="1px solid"
                  borderColor="gray.300"
                  bg="#F9F9F9"
                  _dark={{
                    borderColor: "gray.500",
                    bg: "#2e3440",
                  }}
                  borderRadius={5}
                  minHeight="200px"
                  maxHeight={"250px"}
                  p={2}
                  overflowY="auto"
                  ref={logsDiv}
                >
                  {logs.map((message, i) => (
                    <Text
                      fontSize="xs"
                      opacity={0.8}
                      key={i}
                      whiteSpace="pre-line"
                    >
                      {message}
                    </Text>
                  ))}
                </Box>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <HStack w="full" justifyContent="space-between">
                <HStack>
                  <Box>
                    <Button
                      size="sm"
                      leftIcon={
                        <ReloadIcon
                          className={classNames({
                            "animate-spin": isRestarting,
                          })}
                        />
                      }
                      onClick={() => handleRestartCore()}
                    >
                      {t(
                        isRestarting
                          ? "xrayConfig.restarting"
                          : "xrayConfig.restartCore"
                      )}
                    </Button>
                  </Box>
                </HStack>

                <HStack>
                  <Button
                    size="sm"
                    variant="solid"
                    colorScheme="primary"
                    px="5"
                    type="submit"
                    isDisabled={isLoading || isPostLoading}
                    isLoading={isPostLoading}
                  >
                    {t("xrayConfig.save")}
                  </Button>
                </HStack>
              </HStack>
            </ModalFooter>
          </form>
        </TabPanel>
        <TabPanel px="0">
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box
                border="1px solid"
                borderColor="gray.200"
                _dark={{ borderColor: "gray.700" }}
                borderRadius="lg"
                p={4}
              >
                <HStack justifyContent="space-between" mb={3}>
                  <Text fontWeight="semibold">
                    {t("xrayConfig.templatesList")}
                  </Text>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleSelectTemplate()}
                  >
                    {t("xrayConfig.newTemplate")}
                  </Button>
                </HStack>
                <Divider mb={3} />
                <VStack align="stretch" spacing={2}>
                  {isTemplatesLoading && (
                    <Text fontSize="sm">{t("xrayConfig.loadingTemplates")}</Text>
                  )}
                  {!isTemplatesLoading && templates?.length === 0 && (
                    <Text fontSize="sm" color="gray.500">
                      {t("xrayConfig.noTemplate")}
                    </Text>
                  )}
                  {templates?.map((template) => (
                    <HStack
                      key={template.id}
                      justifyContent="space-between"
                      alignItems="flex-start"
                      border="1px solid"
                      borderColor={
                        activeTemplateId === template.id
                          ? "primary.500"
                          : "gray.200"
                      }
                      _dark={{
                        borderColor:
                          activeTemplateId === template.id
                            ? "primary.400"
                            : "gray.700",
                        bg:
                          activeTemplateId === template.id
                            ? "rgba(58, 90, 255, 0.08)"
                            : "transparent",
                      }}
                      borderRadius="md"
                      p={2}
                      bg={
                        activeTemplateId === template.id
                          ? "primary.50"
                          : "transparent"
                      }
                    >
                      <Box>
                        <Text fontWeight="medium">{template.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {t("xrayConfig.templateUsage", {
                            count: template.nodes_count || 0,
                          })}
                        </Text>
                      </Box>
                      <HStack>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleSelectTemplate(template.id)}
                        >
                          {t("xrayConfig.editTemplate")}
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleTemplateDelete(template.id)}
                          isDisabled={isTemplatePosting}
                        >
                          {t("delete")}
                        </Button>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              <Box gridColumn={{ md: "span 2" }}>
                <form onSubmit={handleTemplateSave}>
                  <FormControl mb={3}>
                    <FormLabel>{t("xrayConfig.templateName")}</FormLabel>
                    <Input
                      placeholder={t("xrayConfig.templateNamePlaceholder")}
                      {...templateForm.register("name")}
                    />
                  </FormControl>
                  <FormControl>
                    <HStack justifyContent="space-between" alignItems="center">
                      <FormLabel>{t("xrayConfig.templateConfig")}</FormLabel>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          templateForm.setValue("config", config || {})
                        }
                      >
                        {t("xrayConfig.useDefaultConfig")}
                      </Button>
                    </HStack>
                    <Box position="relative" ref={editorRef} minHeight="300px">
                      <Controller
                        control={templateForm.control}
                        name="config"
                        render={({ field }) => (
                          <JsonEditor json={field.value} onChange={field.onChange} />
                        )}
                      />
                    </Box>
                  </FormControl>
                  <ModalFooter px={0} mt={4}>
                    <Button
                      colorScheme="primary"
                      type="submit"
                      isLoading={isTemplatePosting}
                      isDisabled={isTemplatePosting}
                    >
                      {t("xrayConfig.saveTemplate")}
                    </Button>
                  </ModalFooter>
                </form>
              </Box>
            </SimpleGrid>
          </ModalBody>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
export const CoreSettingsModal: FC = () => {
  const { isEditingCore } = useDashboard();
  const onClose = useDashboard.setState.bind(null, { isEditingCore: false });
  const { t } = useTranslation();

  return (
    <Modal isOpen={isEditingCore} onClose={onClose} size="3xl">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent mx="3" w="full">
        <ModalHeader pt={6}>
          <HStack gap={2}>
            <Icon color="primary">
              <UsageIcon color="white" />
            </Icon>
            <Text fontWeight="semibold" fontSize="lg">
              {t("xrayConfig.title")}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton mt={3} />
        <CoreSettingModalContent />
      </ModalContent>
    </Modal>
  );
};
